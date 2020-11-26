import PreParser from '@/preParser'
import PostParser from '@/postParser'
import input from '@test/header.less'
import output from '@test/output2.css'


const parser = new PreParser()
let result1 = parser.process(input, {context: '', fileInfo: '', imports: []})
console.log(result1)
// let p = new PreParser()
// p.handleType = 1
// const postParser = new PostParser(p)
// let result = postParser.process(output, {context: '', fileInfo: '', imports: []})
// console.log(result)

