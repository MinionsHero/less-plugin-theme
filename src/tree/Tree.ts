import {ThrowLessErrorFunc} from "../utils";

export interface TreeBranch {
    type: 'comment/double' | 'comment/star' | 'statement' | 'statement/property' | 'property/colon' | 'property/brace' | 'property/enter' | 'root',
    // type: //注释 | /*注释*/ | 表达式 | 尾号为;的属性 | 尾号为}的属性| 根
    start: number,
    end: number,
    value: string | { key: string, value: string }
}

export type InnerTreeBranch = TreeBranch & { isClosed: boolean, children?: InnerTreeBranch[] }
export type OpenedInnerTreeBranch = InnerTreeBranch & { children: InnerTreeBranch[] }
export type handlePropertyReturnType = ReturnType<Tree['handleProperty']>

interface ThemeHandler {
    (option: { key: string; value: string }): string
}

export default class Tree {

    private readonly funcName: string
    private readonly root: OpenedInnerTreeBranch
    private readonly throwLessError: ThrowLessErrorFunc

    constructor(funcName: string, throwLessError: ThrowLessErrorFunc) {
        this.funcName = funcName
        this.throwLessError = throwLessError
        this.root = {
            type: 'root',
            start: -1,
            end: 0,
            isClosed: false,
            value: '',
            children: []
        }
    }

    push(branch: TreeBranch, addChildren: boolean) {
        const root = this.getOpenedBranch(this.root)
        if (root) {
            Tree.addBranch(root, branch, addChildren)
        }
        return this
    }

    closeChildren() {
        const parent = this.getOpenedBranch(this.root)
        if (parent) {
            parent.isClosed = true
        }
    }

    private static addBranch(root: OpenedInnerTreeBranch, branch: TreeBranch, addChildren: boolean) {
        const temp: InnerTreeBranch = {...branch, children: undefined, isClosed: false}
        if (addChildren) {
            temp.children = []
        }
        root.children.push(temp)
    }

    private getOpenedBranch(parent: InnerTreeBranch): OpenedInnerTreeBranch | null {
        const children = parent.children
        let findBranch: InnerTreeBranch | null = null
        if (children && !parent.isClosed) {
            findBranch = parent
            for (let i = 0; i < children.length; i++) {
                const branch = children[i]
                const temp = this.getOpenedBranch(branch)
                if (temp) {
                    findBranch = temp
                }
            }
        }
        if (findBranch) {
            return findBranch as OpenedInnerTreeBranch
        }
        return null
    }

    private static findWordMargin(str: string) {
        const match = str.match(/\S/)
        if (match) {
            const leftIndex = match.index
            if (leftIndex !== undefined && leftIndex > -1) {
                const rightIndex = leftIndex + str.trim().length
                if (rightIndex > leftIndex) {
                    const keyValidStr = str.slice(leftIndex, rightIndex)
                    return {
                        start: leftIndex,
                        end: rightIndex,
                        value: keyValidStr,
                        origin: str
                    }
                }
            }
        }
        return null
    }

    private handleProperty(branch: InnerTreeBranch) {
        const {key, value} = branch.value as { key: string; value: string }
        const keyWordResult = Tree.findWordMargin(key)
        const valueWordResult = Tree.findWordMargin(value)
        if (keyWordResult && valueWordResult) {
            return {key: keyWordResult, value: valueWordResult}
        } else {
            this.throwLessError(branch.end, 'Incomplete css property name and value')
        }
    }

    private handle(branch: InnerTreeBranch, output: string, callback: ThemeHandler): string {
        const {type, value} = branch
        output += value
        const isStatement = type === 'statement'
        if ((type === 'statement' || type === 'root') && branch.children) {
            if (isStatement) {
                output += '{'
            }
            output += branch.children.map(b => {
                if (typeof b.value === 'string') {
                    return this.handle(b, '', callback)
                }
                const result = this.handleProperty(b)
                const value = result.value.value
                // 把不符合本插件定义的属性值规范的属性值当做普通表达式处理
                if (value.replace(/\s/g, '').match(new RegExp(this.funcName + '\\(((@\\S+)|(\\{.+\\:.+\\}))\\)'))) {
                    let prefix = result.key.origin.slice(0, result.key.start)
                    let suffix = result.value.origin.slice(result.value.end)
                    let propertyReplaceStr = prefix + callback({
                        key: result.key.value,
                        value: value.slice(this.funcName.length + 1, -1).trim()
                    }) + suffix + (b.type === 'property/enter' ? '\n' : '')
                    return propertyReplaceStr
                } else {
                    return `${b.value.key}:${b.value.value}${(b.type === 'property/enter' ? ';\n' : ';')}`
                }
            }).join('')
            // const unionArr: InnerTreeBranch[] = []
            // let otherPrefix: string = '', otherSuffix: string = ''
            // branch.children.forEach(b => {
            //     if (b.type === 'statement') {
            //         const v = (b.value as string).trim()
            //         if (v !== ';' && v !== '') {
            //             // block
            //             if (unionArr.length > 0) {
            //                 unionArr.map(el => {
            //                     if (['comment/star', 'comment/double', 'statement'].includes(el.type)) {
            //                         return el.value as string
            //                     }
            //                 })
            //             }
            //         }
            //     }
            //
            //     if (b.type.startsWith('property/')) {
            //         const result = this.handleProperty(b)
            //         const value = result.value.value
            //         // 把不符合本插件定义的属性值规范的属性值当做普通表达式处理
            //         if (!value.replace(/\s/g, '').match(/theme\(((@\S+)|(\{.+\:.+\}))\)/)) {
            //             unionArr.push({
            //                 type: 'statement/property',
            //                 start: b.start,
            //                 end: b.end + 1,
            //                 value: result.key.origin + ':' + result.value.origin + (b.type === 'property/enter' ? ';\n' : ';'),
            //                 isClosed: true
            //             })
            //         } else {
            //             others.push({
            //                 branch: b,
            //                 result: result
            //             })
            //         }
            //     }
            // })
            // output += unionArr.map((b, index) => {
            //     return this.handle(b, '', callback)
            // }).join('')
            // if (others.length > 0) {
            //     const start = others[0]
            //     const end = others[others.length - 1]
            //     const startKey = start.result.key
            //     const endValue = end.result.value
            //     otherPrefix = '\n'
            //     otherSuffix = otherPrefix + endValue.origin.slice(endValue.end, endValue.origin.length)
            //     output += callback(branch as OpenedInnerTreeBranch, others.map(el => {
            //         let value = el.result.value.value
            //         value = value.slice(SYNTAX_KEY_WORD.length + 1, -1).trim()
            //         return {
            //             key: el.result.key.value,
            //             value: value
            //         }
            //     })) + otherSuffix
            // } else {
            //     output += ''
            // }
            if (isStatement) {
                output += '}'
            }
        }
        return output
    }

    process(handleThemeGroup: ThemeHandler): string {
        return this.handle(this.root, '', handleThemeGroup)
    }

    toArray() {
        return this.root.children
    }
}
