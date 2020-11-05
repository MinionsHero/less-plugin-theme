import {TreeBranch} from './Tree'
import {ThrowLessErrorFunc} from '../utils'

class CommentCharArr extends Array<{ index: number, char: string }> {
    type: 'undefined' | 'comment/double' | 'comment/star' | 'statement'

    constructor() {
        super();
        this.type = 'undefined'
    }

    secondLastElement() {
        if (this.length > 1) {
            return this[this.length - 2]
        }
        return undefined
    }

    isEmpty() {
        return this.length === 0
    }

    reset() {
        this.length = 0
        this.type = 'undefined'
    }
}

export default class Comment {
    private readonly comment: CommentCharArr
    private readonly throwLessError: ThrowLessErrorFunc

    constructor(index: number, char: string, throwLessError: ThrowLessErrorFunc) {
        this.comment = new CommentCharArr()
        this.comment.reset()
        this.comment.push({
            index,
            char
        })
        this.throwLessError = throwLessError
    }

    get isComment() {
        return this.comment.type !== 'statement'
    }

    genBranch(type): TreeBranch & { value: string } {
        return {
            type: type,
            value: this.comment.map(el => el.char).join(''),
            start: this.comment[0].index,
            end: this.comment[this.comment.length - 1].index
        }
    }

    // 处理注释主体和结尾
    handleChar(index: number, char: string) {
        if (index < 1) {
            throw new Error('index must be greater than 1')
        }
        if (this.comment && this.comment.length > 0) {
            const headCommentChar = this.comment[0]
            this.comment.push({index, char})
            // 注释的第二个字符
            if (index === headCommentChar.index + 1) {
                switch (char) {
                    case '/':
                        // 符合注释 // 的条件
                        this.comment.type = 'comment/double'
                        break
                    case '*':
                        // 符合注释 /* */ 的条件
                        this.comment.type = 'comment/star'
                        break
                    default:
                        // 不符合注释的条件，取消注释
                        this.comment.type = 'statement'
                        return this.genBranch(this.comment.type)
                }
            } else {
                switch (char) {
                    case '\n':
                        // 如果符合注释 // 的条件，则可以收尾了
                        if (this.comment.type === 'comment/double') {
                            return this.genBranch(this.comment.type)
                        }
                        break
                    case '/':
                        // 符合注释 /* */ 的条件，并已经接近收尾
                        if (this.comment.type === 'comment/star') {
                            const secondLastElement = this.comment.secondLastElement()
                            if (secondLastElement && secondLastElement.char === '*') {
                                return this.genBranch(this.comment.type)
                            }
                        }
                        break
                }
            }
        }
    }

    // 如果没有发现注释结尾，如何善后
    handleNotFilledComment() {
        switch (this.comment.type) {
            case 'comment/double':
                return this.genBranch(this.comment.type)
            case "statement":
            case "comment/star":
            case "undefined":
            default:
                return this.throwLessError(this.comment[0].index, 'The comment did not find the ending character.')
        }
    }
}
