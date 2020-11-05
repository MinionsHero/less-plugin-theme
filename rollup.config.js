import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2'
import babel from '@rollup/plugin-babel';
import alias from '@rollup/plugin-alias'
import path from 'path'

//通过input路径决定output路径
const handleInput = function (input) {
    const inputSplitArr = input.split('.')
    const end = inputSplitArr[inputSplitArr.length - 1]
    const start = inputSplitArr.reduce(function (prev, next, index) {
        if (index === inputSplitArr.length - 1) {
            return prev
        }
        if (index === 0) {
            return next
        }
        return prev + '.' + next
    }, '')
    let outputExt = ''
    switch (end) {
        case 'vue':
        case 'js':
        case 'ts':
            outputExt = 'js'
            break
        case 'scss':
        case 'less':
        case 'css':
            outputExt = 'css'
            break
    }
    let path = ''
    switch (true){
        case start.includes('less'):
            path = start.replace('/less','')
            break
        case start.includes('scss'):
            path = start.replace('/scss','')
            break
        case start.includes('css'):
            path = start.replace('/css','')
            break
        default:
            path = start
            break
    }
    return path + '.' + outputExt
}
export default [
    {
        input: 'index.ts',
    }
].map(option => {
    const output = path.resolve(process.cwd(), 'lib', option.output || handleInput(option.input))
    return {
        input: path.resolve(process.cwd(), 'src', option.input),
        output: {
            file: path.resolve(process.cwd(), 'lib', output),
            format: 'cjs',
        },
        plugins: [
            alias({
                resolve: ['.jsx', '.js', 'ts'],
                entries: [
                    {find: '~', replacement: process.cwd() + '/node_modules'},
                    {find: '@', replacement: process.cwd() + '/src'},
                ]
            }),
            resolve(),
            commonjs({
                include: 'node_modules/**',
                extensions: ['.js', '.ts', '.d.ts'],
            }),
            babel({
                babelHelpers: 'runtime',
            }),
            typescript({
                tsconfig: path.resolve(process.cwd(), 'tsconfig.json')
            }),
        ]
    }
})
