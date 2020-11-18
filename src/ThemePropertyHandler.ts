import {ThrowLessErrorFunc} from './utils'
import CommentHandler from "@/CommentHandler";

interface CharIndex {
    c: string;
    i: number;
}

class ThemeProperty {
    private readonly charArr: Array<CharIndex>

    constructor() {
        this.charArr = new Array<CharIndex>()
    }

    addChar(c: string, i: number) {
        this.charArr.push({i, c})
    }

    toString() {
        return this.charArr.reduce(function (str, cur,) {
            return str + cur.c
        }, '')
    }

    element(pos: number) {
        return this.charArr[pos]
    }

}

export default class ThemePropertyHandler {
    private readonly throwLessError: ThrowLessErrorFunc

    constructor(throwLessError: ThrowLessErrorFunc) {
        this.throwLessError = throwLessError
    }

    handleInput(input: string, commentHandler: CommentHandler, keyword: string) {
        let i = 0
        const themeProperty = new ThemeProperty()
        while (i < input.length) {
            if (!commentHandler.isComment(i)) {
                themeProperty.addChar(input.charAt(i), i)
            }
            i++
        }
        const str = themeProperty.toString()
        return this.searchProperties(themeProperty, str, keyword)
    }

    // 查找符合theme()的属性。
    searchProperties(themeProperty: ThemeProperty, input: string, keyWord: string) {
        let i = 0;
        let sign = 0
        let property = {start: -1, name: '', value: '', end: -1}
        let arr: string[] = []
        let leftBraceTimes = 0
        let result: { start: number, name: string, value: string, end: number }[] = []
        while (i < input.length) {
            const c = input.charAt(i)
            if (sign === 0) {
                if (['{', '}', ';'].includes(c)) {
                    sign = 1 // 开始查找
                }
            } else if (sign === 1) {
                if (/([a-z]|-)/.test(c)) {
                    debugger
                    sign = 2 // 找到了第一个a-z字符
                    property.start = themeProperty.element(i).i
                    arr.push(c)
                }
            } else if (sign === 2) {
                if (['{', '}', ';'].includes(c)) {
                    sign = 1 // 重新开始查找
                    arr = []
                    property = {start: -1, name: '', value: '', end: -1}
                } else if (c === ':') {
                    sign = 3 // 找到了冒号
                    property.name = arr.join('').trim()
                    arr = []
                } else {
                    arr.push(c)
                }
            } else if (sign === 3) {
                if (!/\s/.test(c)) {
                    const sliceStart = input.slice(i)
                    if (sliceStart.startsWith(keyWord + '(')) {
                        sign = 4 // 找到了theme(
                        arr.push(c)
                    } else {
                        sign = 0 // 白找了，复归原位
                        property = {start: -1, name: '', value: '', end: -1}
                        arr = []
                    }
                }
            } else if (sign === 4) {
                arr.push(c)
                if (c === '(') {
                    sign = 5 // 找到了第一个左小括号
                    leftBraceTimes++
                }
            } else if (sign === 5) {
                arr.push(c)
                if (c === '(') {
                    leftBraceTimes++
                } else if (c === ')') {
                    leftBraceTimes--
                }
                if (leftBraceTimes === 0) {
                    sign = 6 // 找到了对应的右括号
                    property.value = arr.join('').trim()
                    property.end = themeProperty.element(i).i + 1
                    arr = []
                }
            } else if (sign === 6) {
                if (!/\s/.test(c)) {
                    if (c === ';' || c === '}') {
                        sign = 1
                        result.push({...property})
                        property = {start: -1, name: '', value: '', end: -1}
                    } else {
                        const el = themeProperty.element(i)
                        if (el) {
                            this.throwLessError(el.i, 'Missing the closing semicolon or right brace')
                        }
                    }
                }
            }
            i++
        }
        if (sign >= 4) {
            const el = themeProperty.element(input.length - 1)
            this.throwLessError(property.start, 'Missing the close syntax for ' + keyWord + '(')
        }
        return result
    }
}
