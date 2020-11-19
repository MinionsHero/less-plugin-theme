import ErrorUtil, {ThrowLessErrorFunc} from "@/utils";
import PreParser from "@/preParser";
import {Statement, Block} from './CssTree'

export default class PostParser {

    private preParserGlobal: PreParser

    constructor(p: PreParser) {
        this.preParserGlobal = p
    }

    analysisCss(input: string, throwLessErrorFunc: ThrowLessErrorFunc) {
        let i = 0
        let block: Block = new Block('')
        let statement: Statement = new Statement()
        while (i < input.length) {
            const c = input.charAt(i)
            switch (c) {
                case '{':
                    let selector = statement.valueOf()
                    if (selector) {
                        block.push(new Block(selector))
                        statement.reset()
                    } else {
                        throwLessErrorFunc(i, 'Missing the selector before {.')
                    }
                    break
                case '}':
                    let content = statement.valueOf()
                    if (content) {
                        block.push(content)
                    }
                    statement.reset()
                    block.close()
                    break
                case '/':
                    if (input.charAt(i + 1) === '*') {
                        const commentEndIndex = this.findCommentEndIndex(input, i + 2)
                        if (commentEndIndex > -1) {
                            let content = statement.valueOf()
                            if (content) {
                                block.push(content)
                            }
                            statement.reset()
                            const comment = input.slice(i, commentEndIndex + 1)
                            block.push(comment)
                            i = commentEndIndex + 1
                            break
                        } else {
                            throwLessErrorFunc(i, 'Missing the closing comment.')
                        }
                    }
                    statement.addChar(c)
                    break
                case ';':
                    statement.addChar(c)
                    let content1 = statement.valueOf()
                    if (content1) {
                        block.push(content1)
                    }
                    statement.reset()
                    break;
                default:
                    statement.addChar(c)
                    break
            }
            i++
        }
        let rest = statement.valueOf()
        if (rest) {
            block.push(rest)
            statement.reset()
        }
        return block
    }

    process(input: string, {context, imports, fileInfo}: { context: any, imports: any, fileInfo: string }) {
        if (this.preParserGlobal.handleType === 1) {
            const throwLessError = ErrorUtil(fileInfo, input).throwLessError
            const block = this.analysisCss(input, throwLessError)
            const r = block.toString()
            this.preParserGlobal.handleType = 0
            return r
        }
        if (this.preParserGlobal.handleType === 1) {
            this.preParserGlobal.handleType = 0
        }
        return input
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
