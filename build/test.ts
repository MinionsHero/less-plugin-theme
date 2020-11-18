import PreParser from '@/preParser'
import PostParser from '@/postParser'
import input from '@test/input.less'
import output from '@test/output.css'


// const parser = new PreParser()
// let result1 = parser.process(input, {context: '', fileInfo: '', imports: []})
// console.log(result1)
const postParser = new PostParser()
let result = postParser.process(output, {context: '', fileInfo: '', imports: []})
console.log(result)

