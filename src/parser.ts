import Comment from "./tree/Comment";
import Tree, {InnerTreeBranch, OpenedInnerTreeBranch} from "./tree/Tree";
import Statement from "./tree/Statement";
import ErrorUtil, {ThrowLessErrorFunc} from "./utils";

export interface PropertyHandlerType {
    (option: { key: string; value: string }): string
}

export interface OptionType {
    themeIdentityKeyWord?: string,
    themePropertyValueHandler?: PropertyHandlerType
}

export default class Parser {
    private input: string = ''
    private context: any
    private imports: any
    private fileInfo: any
    private throwLessError: ThrowLessErrorFunc
    private readonly themeIdentityKeyWord: string
    private readonly themePropertyValueHandler: PropertyHandlerType

    constructor(options?: OptionType) {
        this.themeIdentityKeyWord = options && options.themeIdentityKeyWord || 'theme'
        this.themePropertyValueHandler = options && options.themePropertyValueHandler ||
            function ({key, value}) {
                return `each(${value}, {
                            @class: replace(@key, '@', '');
                                .@{class} & {
                                    ${key}: @value;
                                }
                            });`
            }
        this.throwLessError = (index, message) => {
            throw new Error(message)
        }
    }

    process(input: string, {context, imports, fileInfo}: { context: any, imports: any, fileInfo: string }) {
        this.throwLessError = ErrorUtil(fileInfo, input).throwLessError
        this.input = input
        this.context = context
        this.imports = imports
        this.fileInfo = fileInfo
        const tree = this.parse()
        return tree.process(this.themePropertyValueHandler)
    }

    parse() {
        const input = this.input
        let tree = new Tree(this.themeIdentityKeyWord, this.throwLessError)
        let comment: Comment | null = null // 注释 // 第一个/开头，\n结尾 或者 第一个/开头，然后 * ，... ，最后*，最后/结尾
        let state: Statement | null = null // 声明或者语句
        let isFindColon = false // 是否查找到了冒号
        let leftBraceTimes: number = 0
        let isFindLeftBraceVariable = false

        function takeAsState(index: number, char: string) {
            if (state) {
                state.suffix(index, char)
            } else {
                state = new Statement(index, index, char)
            }
        }

        const addStatement = (addChildren) => {
            if (state) {
                tree.push(state.genBranch(), addChildren)
                state = null
            }
        }

        const addProperty = (type: InnerTreeBranch['type']) => {
            if (state) {
                const value = state.valueOf()
                if (value.length > 3 && value.indexOf(':') > 0 && value.indexOf(':') < value.length - 1) {
                    const {key, value} = state.splitProperty()
                    tree.push({
                        type: type,
                        value: {key, value},
                        start: state.start,
                        end: state.end
                    }, false)
                    isFindColon = false
                } else {
                    this.throwLessError(state.end, 'The less statement has incomplete property value')
                }
            }
            state = null
        }

        for (let index = 0; index < input.length; index++) {
            const char = input.charAt(index)
            if (comment) {
                const branch = comment.handleChar(index, char)
                if (branch) {
                    if (branch.type.startsWith('comment/')) {
                        addStatement(false)
                        tree.push(branch, false)
                    } else if (branch.type === 'statement') {
                        if (state) {
                            state.suffix(branch.end, branch.value)
                        } else {
                            state = new Statement(branch.start, branch.end, branch.value)
                        }
                    }
                    comment = null
                }
                continue
            }
            switch (char) {
                // 可能是注释起始或者语句，如/deep/
                case '/':
                    comment = new Comment(index, char, this.throwLessError)
                    break
                // 可能是block或者map
                case '{':
                    if (state) {
                        // theme({
                        if (isFindColon) {
                            takeAsState(index, char)
                            leftBraceTimes++
                            break
                        }
                        if (input.charAt(index - 1) === '@') {
                            isFindLeftBraceVariable = true
                            takeAsState(index, char)
                            break
                        }
                        addStatement(true)
                    } else {
                        this.throwLessError(index, 'Open curly braces cannot be used as the starting statement for less.')
                    }
                    break
                case '}':
                    if (isFindColon) {
                        // 查找theme({匹配的右半部分
                        if (leftBraceTimes > 0) {
                            takeAsState(index, char)
                            leftBraceTimes--
                            if (leftBraceTimes === 1) {
                                leftBraceTimes = 0
                            }
                            break
                        }
                        addProperty('property/brace')
                        break
                    }
                    if (isFindLeftBraceVariable) {
                        isFindLeftBraceVariable = false
                        takeAsState(index, char)
                        break
                    }
                    addStatement(false)
                    tree.closeChildren()
                    break
                case ';':
                    // 如果以回车或者;结尾，则整理键值对
                    if (isFindColon && leftBraceTimes === 0) {
                        addProperty('property/colon')
                        break
                    }
                    takeAsState(index, char)
                    break
                case '\n':
                    if (isFindColon && leftBraceTimes === 0) {
                        const nextStr = input.slice(index + 1)
                        if (nextStr.indexOf(';') > -1 || nextStr.indexOf('}') > 1) {
                            takeAsState(index, char)
                            break
                        } else {
                            this.throwLessError(index - 1, 'A semicolon is missing at the end of an attribute.')
                        }
                    }
                    break
                case ':':
                    // 可能是选择器语句或者属性值后面的冒号
                    // :nth-child(1) :focus  :hover
                    // color:red;
                    // color:theme({white:#dddddd;});
                    // color: red;background-color:theme({white:#dddddd;});
                    if (!isFindColon) {
                        const nextStartIndex = index + 1
                        const nextStr = input.slice(nextStartIndex)
                        const splits = [nextStr.indexOf(';'), nextStr.indexOf('}'), nextStr.indexOf('\n')].filter(index => index > -1)
                        if (splits.length === 0) {
                            const temp = nextStr.length - 1
                            if (temp > index) {
                                splits.push(temp)
                            } else {
                                this.throwLessError(index, '冒号后面缺少代码')
                            }
                        }
                        const splitIndex = splits.sort((a, b) => a - b)[0]
                        const leftBraceIndex = nextStr.slice(0, splitIndex).indexOf('{')
                        if (leftBraceIndex === -1 || input.slice(nextStartIndex, nextStartIndex + leftBraceIndex).trim().endsWith('(')) {
                            isFindColon = true
                            if (leftBraceIndex > -1) {
                                leftBraceTimes = 1 // theme(@{@{variable}});
                            } else {
                                leftBraceTimes = 0
                            }
                        }
                    }
                    takeAsState(index, char)
                    break
                default:
                    takeAsState(index, char)
                    break
            }
        }
        if (comment) {
            const branch = comment.handleNotFilledComment()
            if (branch) {
                tree.push(branch, false)
                comment = null
            }
        }
        if (state) {
            addStatement(false)
            tree.closeChildren()
        }
        if (leftBraceTimes > 0) {
            this.throwLessError(input.length - 1, 'Incomplete block of statements')
        }
        return tree
    }
}
