export class Statement {
    private arr: string[]

    constructor() {
        this.arr = []
    }

    addChar(c: string) {
        this.arr.push(c)
    }

    reset() {
        this.arr = []
    }

    valueOf() {
        return this.arr.join('').trim()
    }
}


function repeatTabChar(times: number): string {
    if (times > 0) {
        return '\t'.repeat(times)
    }
    return ''
}

export class Block {
    selector: string
    content: (Block | string)[]
    private isClosed: boolean

    constructor(selector: string) {
        this.selector = selector
        this.content = []
        this.isClosed = false
    }

    private isRoot() {
        return this.selector === ''
    }

    push(content: (Block | string)) {
        if (!this.isClosed) {
            let result = false
            for (let i = 0; i < this.content.length; i++) {
                let el = this.content[i]
                if (typeof el !== 'string') {
                    result = el.push(content)
                    if (result) {
                        return true
                    }
                }
            }
            if (!result) {
                this.content.push(content)
                return true
            }
        }
        return false
    }

    close() {
        let result = false
        this.content.forEach((el) => {
            if (typeof el !== 'string') {
                result = el.close()
            }
        })
        if (!result && !this.isClosed) {
            this.isClosed = true
            return true
        }
        return result
    }

    private mergeContent(content: (Block | string)[]): (Block | string)[] {
        let arr: (Block | string)[] = []
        content.forEach(el => {
            if (typeof el === 'string') {
                arr.push(el)
            } else {
                let index = arr.findIndex((item) => {
                    return item instanceof Block && item.selector === el.selector
                })
                if (index > -1) {
                    const existElement = arr[index] as Block
                    existElement.content = existElement.content.concat(el.content)
                } else {
                    arr.push(el)
                }
            }
        })
        // console.log(arr)
        // 必须上面的遍历合并同类项完毕才能遍历内部的，否则会导致外部未合并完，内部又得合并，参考
        // @media媒体查询嵌套 output2.css
        return arr.map(el => {
            if (typeof el === 'string') {
                return el
            }
            let block = new Block(el.selector)
            block.content = this.mergeContent(el.content)
            return block
        })
    }

    private merge(): Block {
        let block = new Block(this.selector)
        block.content = this.mergeContent(this.content)
        return block
    }

    private join(i?) {
        if (i === undefined) {
            i = -1
        }
        return `${repeatTabChar(i)}${this.selector ? this.selector.replace('\n', '\n' + repeatTabChar(i)) + ' {\n' : ''}`
            + this.content.map(el => {
                if (typeof el === 'string') {
                    return repeatTabChar(i + 1) + el.replace('\n', '\n' + repeatTabChar(i))
                }
                return el.join(i + 1)
            }).join(repeatTabChar(i) + '\n')
            + (this.selector ? '\n' + repeatTabChar(i) + '}' : repeatTabChar(i))
    }

    toString() {
        const b = this.merge()
        return b.join()
    }
}
