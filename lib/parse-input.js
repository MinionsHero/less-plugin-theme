let keyword = 'theme'

function init(str) {
    str = str.replace(/\r\n?/g, '\n');
    // Unix系统编辑文件会产生一个特殊字符
    str = str.replace(/^\uFEFF/, '');
    return str
}

// 查找注释字符位置
function lookForComment(input, {throwError}) {
    let index = 0
    const commentIndexArr = []
    // const commentStartEndArr = []
    while (index < input.length) {
        const char = input.charAt(index)
        if (char === '/') {
            const nextChar = input.charAt(index + 1)
            switch (nextChar) {
                case '/':
                    let nextNewLine = input.indexOf('\n', index + 2)
                    if (nextNewLine < 0) {
                        nextNewLine = input.length
                    }
                    // commentStartEndArr.push({
                    //     start: index,
                    //     end: nextNewLine - 1
                    // })
                    for (let i = index; i < nextNewLine; i++) {
                        commentIndexArr.push(i)
                    }
                    break
                case '*':
                    const nextStartSlash = input.indexOf('*/', index + 2)
                    if (nextStartSlash > -1) {
                        // commentStartEndArr.push({
                        //     start: index,
                        //     end: nextStartSlash + 1
                        // })
                        for (let i = index; i < nextStartSlash + 2; i++) {
                            commentIndexArr.push(i)
                        }
                    } else {
                        throwError(input.length - 1, '/*格式的注释缺少结尾的 */')
                    }
                    break
            }
        }
        index++
    }
    return commentIndexArr
}

function searchBlock(str, {throwError}) {
    let index = 0
    let leftBraceArr = []
    let rightBraceArr = []
    let themeSyntaxBraceArr = []
    let themeSyntaxVariableArr = []
    let themeSyntaxAppear = false
    while (index < str.length) {
        const char = str.charAt(index)
        switch (char) {
            case '{':
                // color: theme({}),抛开 .theme({})
                if (str.slice(index - 6, index) === `${keyword}(` && /(\s|\:)/.test(str.charAt(index - 7))) {
                    let themeSyntaxBraceLeft = index
                    const themeSyntaxBraceRight = str.indexOf('}', index)
                    if (/^\s*\)\s*;/.test(str.slice(themeSyntaxBraceRight + 1, themeSyntaxBraceRight + 20))) {
                        themeSyntaxBraceArr.push({
                            start: themeSyntaxBraceLeft,
                            end: themeSyntaxBraceRight
                        })
                        themeSyntaxAppear = true
                        break
                    } else {
                        throwError(index - 6, 'theme({的后面缺少);，其中分号;是必须的')
                    }
                }
                leftBraceArr.push(index)
                break
            case '}':
                if (themeSyntaxAppear) {
                    const lastThemeSyntax = themeSyntaxBraceArr[themeSyntaxBraceArr.length - 1]
                    if (lastThemeSyntax && lastThemeSyntax.end === index) {
                        themeSyntaxAppear = false
                        break
                    } else {
                        throwError(index - 1, 'theme({的后面缺少}')
                    }
                }
                rightBraceArr.push(index)
                break
            case '@':
                // color: theme(@),抛开 .theme(@)
                if (str.slice(index - 6, index) === `${keyword}(` && /(\s|\:)/.test(str.charAt(index - 7))) {
                    const result = str.slice(index).match(/\s*\)\s*;/)
                    if (result && result.index > -1) {
                        themeSyntaxVariableArr.push({
                            start: index,
                            end: index + result.index - 1
                        })
                    } else {
                        throwError(index, 'theme(@)的@后面缺少;')
                    }
                }
                break

        }
        index++
    }
    if (leftBraceArr.length !== rightBraceArr.length) {
        throw new Error('less语句中的大括号{}数量不匹配')
    }
    // debugger
    let braceArr = []
    let temp = []
    while (rightBraceArr.length > 0) {
        const headRightBrace = rightBraceArr[0]
        const index = leftBraceArr.findIndex(leftBrace => leftBrace > headRightBrace)
        if (index === -1) {
            while (rightBraceArr.length > 0) {
                temp.push({
                    start: leftBraceArr.pop(),
                    end: rightBraceArr.shift()
                })
            }
        } else {
            const matchLeftBraceArr = leftBraceArr.splice(0, index)
            while (matchLeftBraceArr.length > 0) {
                temp.push({
                    start: matchLeftBraceArr.pop(),
                    end: rightBraceArr.shift()
                })
            }
        }
        braceArr.push(temp)
        temp = []
    }
    return {
        braceArr,
        themeSyntaxBraceArr,
        themeSyntaxVariableArr
    }
}

function searchThemeCharPos(str, themeSyntaxVariableArr) {
    return themeSyntaxVariableArr.map(({start, end}) => {
        // 向前检索属性名
        let prevIndex = start - 1
        let propertyNameIndex // 属性名前最靠前的空白或者属性名位置
        let colonIndex // 冒号的位置
        let prevFinish = false
        while (prevIndex > -1 && !prevFinish) {
            const char = str.charAt(prevIndex)
            switch (char) {
                case ':':
                    colonIndex = prevIndex
                    break
                case ';':
                case '{':
                    propertyNameIndex = prevIndex + 1
                    prevFinish = true
                    break
            }
            prevIndex--
        }
        if (colonIndex === undefined) {
            throw new Error('theme()应该作为属性的值使用')
        }
        if (prevIndex === -1) {
            throw new Error('theme()应该放到一个block或者其他属性键值分号;的后面')
        }
        // 向后检索);
        let lastIndex = end + 1
        let semicolonIndex // 分号位置
        let propertyValueEndIndex // 分号后边最后一个空白或者分号的位置
        let nextFinish = false
        while (lastIndex < str.length && !nextFinish) {
            const char = str.charAt(lastIndex)
            switch (char) {
                case ';':
                    // ;后面的第一个非空白符
                    semicolonIndex = lastIndex
                    const nextBlockStart = str.slice(lastIndex + 1).match(/(?<=\s*)\S+/)
                    if (nextBlockStart && nextBlockStart.index === -1) {
                        propertyValueEndIndex = lastIndex // 可能;紧跟着}
                    }
                    propertyValueEndIndex = lastIndex + nextBlockStart.index
                    nextFinish = true
                    break
            }
            lastIndex++
        }
        return {
            variableStart: start,
            variableEnd: end,
            propertyNameIndex,
            colonIndex,
            semicolonIndex,
            propertyValueEndIndex
        }
    })
}

function parseSyntax(str, {
    propertyNameIndex,
    propertyValueEndIndex
}) {
    let code = str.slice(propertyNameIndex, propertyValueEndIndex)
    code = code.trim() // color: theme({light: #ffffff; dark:#dddddd})
    const index = code.indexOf(':')
    if (index > 0 && index < code.length) {
        const name = code.slice(0, index).trim() // color
        const value = code.slice(index + 1).trim() // theme({light: #ffffff; dark:#dddddd;})
        if (name && value) {
            const mapStart = value.indexOf('{')
            const mapEnd = value.indexOf('}')
            if (mapStart > -1 && mapEnd > -1) {
                const map = value.slice(mapStart + 1, mapEnd).trim()
                const keyValues = map.split(';').filter(el => el !== '').reduce((obj, el) => {
                    const [k, v] = el.trim().split(':')
                    if (k && k) {
                        obj[k.trim()] = v.trim()
                    }
                    return obj
                }, {})
                return {
                    name,
                    value: keyValues
                }
            }
        }
    }
}

function renderSyntax({name, value}) {
    return Object.keys(value).map(k => {
        const v = value[k]
        return `
        .${k} &, .${k}& {
              ${name}: ${v};
            }`
    }).join('') + '\n'
}


function parseVariable(str, {
    propertyNameIndex,
    propertyValueEndIndex,
    variableStart,
    variableEnd,
}) {
    let code = str.slice(propertyNameIndex, propertyValueEndIndex)
    code = code.trim() // color: theme(@variable)
    const index = code.indexOf(':')
    if (index > 0 && index < code.length) {
        const name = code.slice(0, index).trim() // color
        const variable = str.slice(variableStart, variableEnd + 1).trim() // @variable
        return {name, variable}
    }
}


function renderVariable({name, variable}) {
    return `
    each(${variable}, {
      @class: replace(@key, '@', '');
      .@{class} &, .@{class}& {
        ${name}: @value;
      }
    })
    `
}

module.exports = function parser(input, options) {
    let temp = init(input)
    const commentArr = lookForComment(temp, options)
    let str = ''
    for (let i = 0; i < temp.length; i++) {
        if (!commentArr.includes(i)) {
            str += temp.charAt(i)
        }
    }
    const {
        themeSyntaxBraceArr,
        themeSyntaxVariableArr
    } = searchBlock(str, options)
    let lastRenderIndex = 0
    const renderContent = [
        ...searchThemeCharPos(str, themeSyntaxBraceArr).map(el => ({...el, type: 'syntax'})),
        ...searchThemeCharPos(str, themeSyntaxVariableArr).map(el => ({...el, type: 'variable'}))
    ].sort((a, b) => {
        return a.propertyNameIndex - b.propertyNameIndex
    }).reduce((output, el) => {
        const {propertyNameIndex, propertyValueEndIndex, type} = el
        const keepContent = str.slice(lastRenderIndex, propertyNameIndex)
        const replaceContent = type === 'syntax' ? renderSyntax(parseSyntax(str, el)) : renderVariable(parseVariable(str, el))
        lastRenderIndex = propertyValueEndIndex + 1
        return output + keepContent + replaceContent
    }, '') + str.slice(lastRenderIndex)
    return renderContent
}

