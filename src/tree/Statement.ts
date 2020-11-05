import {TreeBranch} from "./Tree";

export default class Statement {
    readonly start: number
    end: number
    private value: string

    constructor(start: number, end: number, value: string) {
        this.start = start
        this.end = end
        this.value = value
    }

    suffix(end: number, value: string) {
        this.end = end
        this.value += value
    }

    valueOf() {
        return this.value.trim()
    }

    splitProperty() {
        const index = this.value.indexOf(':')
        const key = this.value.slice(0, index)
        const value = this.value.slice(index + 1)
        return {key, value}
    }

    genBranch(): TreeBranch {
        return {
            type: 'statement',
            value: this.value,
            start: this.start,
            end: this.end
        }
    }
}
