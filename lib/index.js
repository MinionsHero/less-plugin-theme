'use strict';

function getLocation(index, inputStream) {
    let n = index + 1;
    let column = -1;
    while (--n >= 0 && inputStream.charAt(n) !== '\n') {
        column++;
    }
    const match = inputStream.slice(0, index).match(/\n/g);
    const line = match ? match.length : -1;
    return {
        line,
        column
    };
}
const anonymousFunc = /(<anonymous>|Function):(\d+):(\d+)/;
/**
 * This is a centralized class of any error that could be thrown internally (mostly by the parser).
 * Besides standard .message it keeps some additional data like a path to the file where the error
 * occurred along with line and column numbers.
 *
 * @class
 * @extends Error
 * @type {module.LessError}
 *
 * @prop {string} type
 * @prop {string} filename
 * @prop {number} index
 * @prop {number} line
 * @prop {number} column
 * @prop {number} callLine
 * @prop {number} callExtract
 * @prop {string[]} extract
 *
 * @param {Object} e              - An error object to wrap around or just a descriptive object
 * @param {Object} fileContentMap - An object with file contents in 'contents' property (like importManager) @todo - move to fileManager?
 * @param {string} [currentFilename]
 */
class LessError extends Error {
    constructor(message, index, filename, input) {
        super(message);
        this.message = message;
        this.filename = filename;
        this.input = input;
        const { line, column } = getLocation(index, input);
        this.line = line;
        this.column = column;
        // @ts-ignore
        const callLine = this.call && getLocation(this.call, input).line;
        const lines = input ? input.split('\n') : '';
        if (this.line === -1 && this.stack) {
            const found = this.stack.match(anonymousFunc);
            const func = new Function('a', 'throw new Error()');
            let lineAdjust = 0;
            try {
                func();
            }
            catch (e) {
                const match = e.stack.match(anonymousFunc);
                const line = parseInt(match[2]);
                lineAdjust = 1 - line;
            }
            if (found) {
                if (found[2]) {
                    this.line = parseInt(found[2]) + lineAdjust;
                }
                if (found[3]) {
                    this.column = parseInt(found[3]);
                }
            }
        }
        this.callLine = callLine + 1;
        this.callExtract = lines[callLine];
        this.extract = [
            lines[this.line - 2],
            lines[this.line - 1],
            lines[this.line]
        ];
    }
    toString() {
        let message = '';
        const extract = this.extract || [];
        let error = [];
        let errorStr = '';
        let stylize = (str) => str;
        if (this.line !== null) {
            if (typeof extract[0] === 'string') {
                error.push(stylize(`${this.line - 1} ${extract[0]}`));
            }
            if (typeof extract[1] === 'string') {
                let errorTxt = `${this.line} `;
                if (extract[1]) {
                    errorTxt += extract[1].slice(0, this.column) +
                        stylize(stylize(stylize(extract[1].substr(this.column, 1), 'bold') +
                            extract[1].slice(this.column + 1), 'red'));
                }
                error.push(errorTxt);
            }
            if (typeof extract[2] === 'string') {
                error.push(stylize(`${this.line + 1} ${extract[2]}`));
            }
            errorStr = `${error.join('\n') + stylize('')}\n`;
        }
        message += stylize(`${'Syntax'} Error: ${this.message}`);
        if (this.filename) {
            message += stylize(' in ') + this.filename;
        }
        if (this.line) {
            message += stylize(` on line ${this.line}, column ${this.column + 1}:`);
        }
        message += `\n${errorStr}`;
        if (this.callLine) {
            message += `${stylize('from ') + (this.filename || '')}/n`;
            message += `${stylize(this.callLine + '')} ${this.callExtract}/n`;
        }
        return message;
    }
}
function ErrorUtil(filename, input) {
    return {
        throwLessError(index, message) {
            throw new Error(new LessError(message, index, filename, input).toString());
        }
    };
}

class Comment {
    constructor(i) {
        this.type = 'suspect';
        this.charArr = new Array();
        this.charArr.push({ c: '/', i });
    }
    addChar(c, i) {
        this.charArr.push({ c, i });
    }
    get tailSecondChar() {
        const obj = this.charArr[this.charArr.length - 2];
        if (obj) {
            return obj.c;
        }
    }
    get isCommentStart() {
        return this.charArr.length === 2;
    }
    includes(i) {
        let start = this.charArr[0];
        let end = this.charArr[this.charArr.length - 1];
        return i >= start.i && i <= end.i;
    }
    toString() {
        return this.charArr.map(el => el.c).join('');
    }
}
class CommentHandler {
    constructor(input, throwLessError) {
        this.input = input;
        this.current = null;
        this.comments = new Array();
        this.throwLessError = throwLessError;
        this.handleInput();
    }
    // 处理注释主体和结尾
    handleChar(char, index) {
        if (index < 0) {
            throw new Error('index must be greater than 0');
        }
        // 可能是注释起始或者语句，如/deep/
        if (this.current === null && char === '/') {
            this.current = new Comment(index);
            return;
        }
        if (this.current) {
            this.current.addChar(char, index);
            // 如果是注释的第二个字符
            if (this.current.isCommentStart) {
                switch (char) {
                    case '/':
                        // 符合注释 // 的条件
                        this.current.type = 'line';
                        break;
                    case '*':
                        // 符合注释 /* */ 的条件
                        this.current.type = 'block';
                        break;
                    default:
                        // 不符合注释的条件，取消注释
                        this.current = null;
                        break;
                }
            }
            else if ((this.current.type === 'line' && char === '\n') || (this.current.type === 'block' && char === '/' && this.current.tailSecondChar === '*')) {
                // 如果符合注释 // 的条件，则可以收尾了
                this.comments.push(this.current);
                this.current = null;
            }
        }
    }
    // 如果没有发现注释结尾，如何善后
    handleEnd() {
        // 可能碰不到结尾的\n或者 /
        if (this.current) {
            // input 字符串中只有注释，也可能是烂尾注释哦，/** 注释 *
            this.comments.push(this.current);
            this.current = null;
        }
    }
    handleInput() {
        let index = 0;
        while (index < this.input.length) {
            const char = this.input.charAt(index);
            this.handleChar(char, index);
            index++;
        }
        this.handleEnd();
    }
    isComment(i) {
        return this.comments.findIndex(comment => comment.includes(i)) > -1;
    }
    get source() {
        let i = 0;
        let result = '';
        while (i < this.input.length) {
            if (!this.isComment(i)) {
                result += this.input.charAt(i);
            }
            i++;
        }
        return result;
    }
    toString() {
        return this.comments.map(el => el.toString()).join('\n');
    }
}

class ThemeProperty {
    constructor() {
        this.charArr = new Array();
    }
    addChar(c, i) {
        this.charArr.push({ i, c });
    }
    toString() {
        return this.charArr.reduce(function (str, cur) {
            return str + cur.c;
        }, '');
    }
    element(pos) {
        return this.charArr[pos];
    }
}
class ThemePropertyHandler {
    constructor(throwLessError) {
        this.throwLessError = throwLessError;
    }
    handleInput(input, commentHandler, keyword) {
        let i = 0;
        const themeProperty = new ThemeProperty();
        while (i < input.length) {
            if (!commentHandler.isComment(i)) {
                themeProperty.addChar(input.charAt(i), i);
            }
            i++;
        }
        const str = themeProperty.toString();
        return this.searchProperties(themeProperty, str, keyword);
    }
    // 查找符合theme()的属性。
    searchProperties(themeProperty, input, keyWord) {
        let i = 0;
        let sign = 0;
        let property = { start: -1, name: '', value: '', end: -1 };
        let arr = [];
        let leftBraceTimes = 0;
        let result = [];
        while (i < input.length) {
            const c = input.charAt(i);
            if (sign === 0) {
                if (['{', '}', ';'].includes(c)) {
                    sign = 1; // 开始查找
                }
            }
            else if (sign === 1) {
                if (/[a-z]/.test(c)) {
                    sign = 2; // 找到了第一个a-z字符
                    property.start = themeProperty.element(i).i;
                    arr.push(c);
                }
            }
            else if (sign === 2) {
                if (['{', '}', ';'].includes(c)) {
                    sign = 1; // 重新开始查找
                    arr = [];
                    property = { start: -1, name: '', value: '', end: -1 };
                }
                else if (c === ':') {
                    sign = 3; // 找到了冒号
                    property.name = arr.join('').trim();
                    arr = [];
                }
                else {
                    arr.push(c);
                }
            }
            else if (sign === 3) {
                if (!/\s/.test(c)) {
                    const sliceStart = input.slice(i);
                    if (sliceStart.startsWith(keyWord + '(')) {
                        sign = 4; // 找到了theme(
                        arr.push(c);
                    }
                    else {
                        sign = 0; // 白找了，复归原位
                        property = { start: -1, name: '', value: '', end: -1 };
                        arr = [];
                    }
                }
            }
            else if (sign === 4) {
                arr.push(c);
                if (c === '(') {
                    sign = 5; // 找到了第一个左小括号
                    leftBraceTimes++;
                }
            }
            else if (sign === 5) {
                arr.push(c);
                if (c === '(') {
                    leftBraceTimes++;
                }
                else if (c === ')') {
                    leftBraceTimes--;
                }
                if (leftBraceTimes === 0) {
                    sign = 6; // 找到了对应的右括号
                    property.value = arr.join('').trim();
                    property.end = themeProperty.element(i).i + 1;
                    arr = [];
                }
            }
            else if (sign === 6) {
                if (!/\s/.test(c)) {
                    if (c === ';' || c === '}') {
                        sign = 0;
                        result.push({ ...property });
                        property = { start: -1, name: '', value: '', end: -1 };
                    }
                    else {
                        const el = themeProperty.element(i);
                        if (el) {
                            this.throwLessError(el.i, 'Missing the closing semicolon or right brace');
                        }
                    }
                }
            }
            i++;
        }
        if (sign >= 4) {
            const el = themeProperty.element(input.length - 1);
            this.throwLessError(property.start, 'Missing the close syntax for ' + keyWord + '(');
        }
        return result;
    }
}

class Parser {
    constructor(options) {
        this.input = '';
        this.themeIdentityKeyWord = options && options.themeIdentityKeyWord || 'theme';
        this.themePropertyValueHandler = options && options.themePropertyValueHandler ||
            function ({ key, value }) {
                return `each(${value}, {
                            @class: replace(@key, '@', '');
                                .@{class} & {
                                    ${key}: @value;
                                }
                            });`;
            };
        this.throwLessError = (index, message) => {
            throw new Error(message);
        };
    }
    process(input, { context, imports, fileInfo }) {
        this.throwLessError = ErrorUtil(fileInfo, input).throwLessError;
        this.input = input;
        this.context = context;
        this.imports = imports;
        this.fileInfo = fileInfo;
        return this.parse();
    }
    parse() {
        const input = this.input;
        const commentHandler = new CommentHandler(input, this.throwLessError);
        const themePropertyHandler = new ThemePropertyHandler(this.throwLessError);
        const properties = themePropertyHandler.handleInput(input, commentHandler, this.themeIdentityKeyWord);
        let index = 0;
        let result = properties.reduce((output, el) => {
            output += input.slice(index, el.start);
            // 校验el.value是否符合格式规范
            if (!/theme\(((@\S+)|(\{([\s\S]*)\}))\)/.test(el.value)) {
                this.throwLessError(el.start, `Invalid ${this.themeIdentityKeyWord} value.`);
            }
            let value = el.value.slice(`${this.themeIdentityKeyWord}(`.length, -1);
            output += this.themePropertyValueHandler({ key: el.name, value: value });
            index = el.end + 1;
            return output;
        }, '');
        if (index < input.length) {
            result += input.slice(index);
        }
        return result;
    }
}

class LessPluginTheme {
    constructor(options) {
        this.minVersion = [3, 5, 0];
        this.options = options;
    }
    install(less, pluginManager) {
        pluginManager.addPreProcessor(new Parser(this.options));
    }
}

module.exports = LessPluginTheme;
