import ErrorUtil from "@/utils";

class Block {
    selector: string
    content: (Comment | string)[]

    constructor(selector: string) {
        this.selector = selector
        this.content = []
    }

    pushContent(content: (Comment | string)) {
        this.content.push(content)
    }

    concatContents(contents: (Comment | string)[]) {
        this.content = this.content.concat(contents)
    }

}

class Comment {
    private content: string

    constructor(content: string) {
        this.content = content
    }

    toString() {
        return this.content
    }
}

export default class PostParser {

    process(input: string, {context, imports, fileInfo}: { context: any, imports: any, fileInfo: string }) {
        let throwLessErrorFunc = ErrorUtil(fileInfo, input).throwLessError
        let i = 0
        let block: Block | null = null
        let result: (Comment | Block)[] = []
        let arr: string[] = []
        while (i < input.length) {
            const c = input.charAt(i)
            switch (c) {
                case '{':
                    let selector = arr.join('').trim()
                    if (selector) {
                        block = new Block(selector)
                        arr = []
                    } else {
                        throwLessErrorFunc(i, 'Missing the selector before {.')
                    }
                    break
                case '}':
                    if (block) {
                        let content = arr.join('').trim()
                        if (content) {
                            block.pushContent(content)
                        }
                        result.push(block)
                        block = null
                        arr = []
                    } else {
                        throwLessErrorFunc(i, 'Missing the selector before {.')
                    }
                    break
                case '/':
                    if (input.charAt(i + 1) === '*') {
                        const commentEndIndex = this.findCommentEndIndex(input, i + 2)
                        if (commentEndIndex > -1) {
                            let content = arr.join('').trim()
                            if (content) {
                                if (block) {
                                    block.pushContent(content)
                                    arr = []
                                }
                            }
                            const comment = new Comment(input.slice(i, commentEndIndex + 1))
                            if (block) {
                                block.pushContent(comment)
                            } else {
                                result.push(comment)
                            }
                            i = commentEndIndex + 1
                        } else {
                            throwLessErrorFunc(i, 'Missing the closing comment.')
                        }
                        break
                    }
                    arr.push(c)
                    break
                default:
                    arr.push(c)
                    break
            }
            i++
        }
        if (arr.join('').trim()) {
            throwLessErrorFunc(i - 1, 'Syntax error.')
        }
        return this.join(this.output(result))
    }

    output(result: (Comment | Block)[]) {
        let arr: (Comment | Block)[] = []
        result.forEach((el) => {
            if (el instanceof Comment) {
                arr.push(el)
            } else {
                let selector = el.selector
                const index = arr.findIndex((item) => {
                    return item instanceof Block && item.selector === selector
                })
                if (index > -1) {
                    const block = arr[index] as Block
                    block.concatContents(el.content)
                } else {
                    arr.push(el)
                }
            }
        })
        return arr
    }

    join(result: (Comment | Block)[]) {
        return result.map(el => {
            if (el instanceof Comment) {
                return el.toString()
            } else {
                return `${el.selector} {\n  ${el.content.join('\n  ')}\n}`
            }
        }).join('\n')
    }

    findCommentEndIndex(input: string, index: number): number {
        let offset = input.slice(index).indexOf('*')
        if (offset > -1) {
            let starIndex = index + offset
            let nextIndex = starIndex + 1
            if (input.charAt(nextIndex) === '/') {
                return nextIndex
            } else {
                // 继续查找
                return this.findCommentEndIndex(input, nextIndex)
            }
        }
        return -1
    }
}
