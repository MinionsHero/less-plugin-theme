import {ThrowLessErrorFunc} from './utils'

interface CharIndex {
    c: string;
    i: number;
}

class Comment {
    type: 'suspect' | 'line' | 'block'
    private readonly charArr: Array<CharIndex>

    constructor(i: number) {
        this.type = 'suspect'
        this.charArr = new Array<CharIndex>()
        this.charArr.push({c: '/', i})
    }

    addChar(c: string, i: number) {
        this.charArr.push({c, i})
    }

    get tailSecondChar() {
        const obj = this.charArr[this.charArr.length - 2]
        if (obj) {
            return obj.c
        }
    }

    get isCommentStart() {
        return this.charArr.length === 2
    }

    includes(i: number) {
        let start = this.charArr[0]
        let end = this.charArr[this.charArr.length - 1]
        return i >= start.i && i <= end.i
    }

    toString() {
        return this.charArr.map(el => el.c).join('')
    }

}

export default class CommentHandler {
    private input: string
    private current: Comment | null
    private readonly comments: Array<Comment>
    private readonly throwLessError: ThrowLessErrorFunc

    constructor(input: string, throwLessError: ThrowLessErrorFunc) {
        this.input = input
        this.current = null
        this.comments = new Array<Comment>()
        this.throwLessError = throwLessError
        this.handleInput()
    }

    // 处理注释主体和结尾
    private handleChar(char: string, index) {
        if (index < 0) {
            throw new Error('index must be greater than 0')
        }
        // 可能是注释起始或者语句，如/deep/
        if (this.current === null && char === '/') {
            this.current = new Comment(index)
            return
        }
        if (this.current) {
            this.current.addChar(char, index)
            // 如果是注释的第二个字符
            if (this.current.isCommentStart) {
                switch (char) {
                    case '/':
                        // 符合注释 // 的条件
                        this.current.type = 'line'
                        break
                    case '*':
                        // 符合注释 /* */ 的条件
                        this.current.type = 'block'
                        break
                    default:
                        // 不符合注释的条件，取消注释
                        this.current = null
                        break
                }
            } else if ((this.current.type === 'line' && char === '\n') || (this.current.type === 'block' && char === '/' && this.current.tailSecondChar === '*')) {
                // 如果符合注释 // 的条件，则可以收尾了
                this.comments.push(this.current)
                this.current = null
            }
        }
    }

    // 如果没有发现注释结尾，如何善后
    private handleEnd() {
        // 可能碰不到结尾的\n或者 /
        if (this.current) {
            // input 字符串中只有注释，也可能是烂尾注释哦，/** 注释 *
            this.comments.push(this.current)
            this.current = null
        }
    }

    private handleInput() {
        let index = 0
        while (index < this.input.length) {
            const char = this.input.charAt(index)
            this.handleChar(char, index)
            index++
        }
        this.handleEnd()
    }

    isComment(i: number) {
        return this.comments.findIndex(comment => comment.includes(i)) > -1
    }

    get source() {
        let i = 0
        let result = ''
        while (i < this.input.length) {
            if (!this.isComment(i)) {
                result += this.input.charAt(i)
            }
            i++
        }
        return result
    }


    toString() {
        return this.comments.map(el => el.toString()).join('\n')
    }
}
