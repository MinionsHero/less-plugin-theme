import ErrorUtil, {ThrowLessErrorFunc} from "@/utils";
import CommentHandler from "@/CommentHandler";
import ThemePropertyHandler from "@/ThemePropertyHandler";

export interface PropertyHandlerType {
    (option: { key: string; value: string }): string
}

export interface OptionType {
    themeIdentityKeyWord?: string,
    themePropertyValueHandler?: PropertyHandlerType
}

export default class PreParser {
    private input: string = ''
    private context: any
    private imports: any
    private fileInfo: any
    private throwLessError: ThrowLessErrorFunc
    private readonly themeIdentityKeyWord: string
    private readonly themePropertyValueHandler: PropertyHandlerType
    private readonly themeIdentityRegExp: RegExp

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
        this.themeIdentityRegExp = new RegExp(this.themeIdentityKeyWord + '\\(((@\\S+)|(\\{([\\s\\S]*)\\}))\\)')
    }

    process(input: string, {context, imports, fileInfo}: { context: any, imports: any, fileInfo: string }) {
        this.throwLessError = ErrorUtil(fileInfo, input).throwLessError
        this.input = input
        this.context = context
        this.imports = imports
        this.fileInfo = fileInfo
        if (this.input.match(this.themeIdentityRegExp)) {
            return this.parse()
        } else {
            return this.input
        }
    }

    private parse() {
        const input = this.input
        const commentHandler = new CommentHandler(input, this.throwLessError)
        const themePropertyHandler = new ThemePropertyHandler(this.throwLessError)
        const properties = themePropertyHandler.handleInput(input, commentHandler, this.themeIdentityKeyWord)
        let index = 0
        let result = properties.reduce((output, el) => {
            output += input.slice(index, el.start)
            // 校验el.value是否符合格式规范
            if (!this.themeIdentityRegExp.test(el.value)) {
                this.throwLessError(el.start, `Invalid ${this.themeIdentityKeyWord} value.`)
            }
            let value = el.value.slice(`${this.themeIdentityKeyWord}(`.length, -1)
            output += this.themePropertyValueHandler({key: el.name, value: value})
            index = el.end + 1
            return output
        }, '')
        if (index < input.length) {
            result += input.slice(index)
        }
        return result
    }
}
