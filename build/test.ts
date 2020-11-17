import Parser from '@/parser'
import input from '@test/input.less'

const parser = new Parser()
let result = parser.process(input, {context: '', fileInfo: '', imports: []})
console.log(result)

