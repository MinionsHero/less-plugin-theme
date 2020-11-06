'use strict';

class CommentCharArr extends Array {
    constructor() {
        super();
        this.type = 'undefined';
    }
    secondLastElement() {
        if (this.length > 1) {
            return this[this.length - 2];
        }
        return undefined;
    }
    isEmpty() {
        return this.length === 0;
    }
    reset() {
        this.length = 0;
        this.type = 'undefined';
    }
}
class Comment {
    constructor(index, char, throwLessError) {
        this.comment = new CommentCharArr();
        this.comment.reset();
        this.comment.push({
            index,
            char
        });
        this.throwLessError = throwLessError;
    }
    get isComment() {
        return this.comment.type !== 'statement';
    }
    genBranch(type) {
        return {
            type: type,
            value: this.comment.map(el => el.char).join(''),
            start: this.comment[0].index,
            end: this.comment[this.comment.length - 1].index
        };
    }
    // 处理注释主体和结尾
    handleChar(index, char) {
        if (index < 1) {
            throw new Error('index must be greater than 1');
        }
        if (this.comment && this.comment.length > 0) {
            const headCommentChar = this.comment[0];
            this.comment.push({ index, char });
            // 注释的第二个字符
            if (index === headCommentChar.index + 1) {
                switch (char) {
                    case '/':
                        // 符合注释 // 的条件
                        this.comment.type = 'comment/double';
                        break;
                    case '*':
                        // 符合注释 /* */ 的条件
                        this.comment.type = 'comment/star';
                        break;
                    default:
                        // 不符合注释的条件，取消注释
                        this.comment.type = 'statement';
                        return this.genBranch(this.comment.type);
                }
            }
            else {
                switch (char) {
                    case '\n':
                        // 如果符合注释 // 的条件，则可以收尾了
                        if (this.comment.type === 'comment/double') {
                            return this.genBranch(this.comment.type);
                        }
                        break;
                    case '/':
                        // 符合注释 /* */ 的条件，并已经接近收尾
                        if (this.comment.type === 'comment/star') {
                            const secondLastElement = this.comment.secondLastElement();
                            if (secondLastElement && secondLastElement.char === '*') {
                                return this.genBranch(this.comment.type);
                            }
                        }
                        break;
                }
            }
        }
    }
    // 如果没有发现注释结尾，如何善后
    handleNotFilledComment() {
        switch (this.comment.type) {
            case 'comment/double':
                return this.genBranch(this.comment.type);
            case "statement":
            case "comment/star":
            case "undefined":
            default:
                return this.throwLessError(this.comment[0].index, 'The comment did not find the ending character.');
        }
    }
}

class Tree {
    constructor(funcName, throwLessError) {
        this.funcName = funcName;
        this.throwLessError = throwLessError;
        this.root = {
            type: 'root',
            start: -1,
            end: 0,
            isClosed: false,
            value: '',
            children: []
        };
    }
    push(branch, addChildren) {
        const root = this.getOpenedBranch(this.root);
        if (root) {
            Tree.addBranch(root, branch, addChildren);
        }
        return this;
    }
    closeChildren() {
        const parent = this.getOpenedBranch(this.root);
        if (parent) {
            parent.isClosed = true;
        }
    }
    static addBranch(root, branch, addChildren) {
        const temp = { ...branch, children: undefined, isClosed: false };
        if (addChildren) {
            temp.children = [];
        }
        root.children.push(temp);
    }
    getOpenedBranch(parent) {
        const children = parent.children;
        let findBranch = null;
        if (children && !parent.isClosed) {
            findBranch = parent;
            for (let i = 0; i < children.length; i++) {
                const branch = children[i];
                const temp = this.getOpenedBranch(branch);
                if (temp) {
                    findBranch = temp;
                }
            }
        }
        if (findBranch) {
            return findBranch;
        }
        return null;
    }
    static findWordMargin(str) {
        const match = str.match(/\S/);
        if (match) {
            const leftIndex = match.index;
            if (leftIndex !== undefined && leftIndex > -1) {
                const rightIndex = leftIndex + str.trim().length;
                if (rightIndex > leftIndex) {
                    const keyValidStr = str.slice(leftIndex, rightIndex);
                    return {
                        start: leftIndex,
                        end: rightIndex,
                        value: keyValidStr,
                        origin: str
                    };
                }
            }
        }
        return null;
    }
    handleProperty(branch) {
        const { key, value } = branch.value;
        const keyWordResult = Tree.findWordMargin(key);
        const valueWordResult = Tree.findWordMargin(value);
        if (keyWordResult && valueWordResult) {
            return { key: keyWordResult, value: valueWordResult };
        }
        else {
            this.throwLessError(branch.end, 'Incomplete css property name and value');
        }
    }
    handle(branch, output, callback) {
        const { type, value } = branch;
        output += value;
        const isStatement = type === 'statement';
        if ((type === 'statement' || type === 'root') && branch.children) {
            if (isStatement) {
                output += '{';
            }
            output += branch.children.map(b => {
                if (typeof b.value === 'string') {
                    return this.handle(b, '', callback);
                }
                const result = this.handleProperty(b);
                const value = result.value.value;
                // 把不符合本插件定义的属性值规范的属性值当做普通表达式处理
                if (value.replace(/\s/g, '').match(new RegExp(this.funcName + '\\(((@\\S+)|(\\{.+\\:.+\\}))\\)'))) {
                    let prefix = result.key.origin.slice(0, result.key.start);
                    let suffix = result.value.origin.slice(result.value.end);
                    let propertyReplaceStr = prefix + callback({
                        key: result.key.value,
                        value: value.slice(this.funcName.length + 1, -1).trim()
                    }) + suffix + (b.type === 'property/enter' ? '\n' : '');
                    return propertyReplaceStr;
                }
                else {
                    return `${b.value.key}:${b.value.value}${(b.type === 'property/enter' ? ';\n' : ';')}`;
                }
            }).join('');
            // const unionArr: InnerTreeBranch[] = []
            // let otherPrefix: string = '', otherSuffix: string = ''
            // branch.children.forEach(b => {
            //     if (b.type === 'statement') {
            //         const v = (b.value as string).trim()
            //         if (v !== ';' && v !== '') {
            //             // block
            //             if (unionArr.length > 0) {
            //                 unionArr.map(el => {
            //                     if (['comment/star', 'comment/double', 'statement'].includes(el.type)) {
            //                         return el.value as string
            //                     }
            //                 })
            //             }
            //         }
            //     }
            //
            //     if (b.type.startsWith('property/')) {
            //         const result = this.handleProperty(b)
            //         const value = result.value.value
            //         // 把不符合本插件定义的属性值规范的属性值当做普通表达式处理
            //         if (!value.replace(/\s/g, '').match(/theme\(((@\S+)|(\{.+\:.+\}))\)/)) {
            //             unionArr.push({
            //                 type: 'statement/property',
            //                 start: b.start,
            //                 end: b.end + 1,
            //                 value: result.key.origin + ':' + result.value.origin + (b.type === 'property/enter' ? ';\n' : ';'),
            //                 isClosed: true
            //             })
            //         } else {
            //             others.push({
            //                 branch: b,
            //                 result: result
            //             })
            //         }
            //     }
            // })
            // output += unionArr.map((b, index) => {
            //     return this.handle(b, '', callback)
            // }).join('')
            // if (others.length > 0) {
            //     const start = others[0]
            //     const end = others[others.length - 1]
            //     const startKey = start.result.key
            //     const endValue = end.result.value
            //     otherPrefix = '\n'
            //     otherSuffix = otherPrefix + endValue.origin.slice(endValue.end, endValue.origin.length)
            //     output += callback(branch as OpenedInnerTreeBranch, others.map(el => {
            //         let value = el.result.value.value
            //         value = value.slice(SYNTAX_KEY_WORD.length + 1, -1).trim()
            //         return {
            //             key: el.result.key.value,
            //             value: value
            //         }
            //     })) + otherSuffix
            // } else {
            //     output += ''
            // }
            if (isStatement) {
                output += '}';
            }
        }
        return output;
    }
    process(handleThemeGroup) {
        return this.handle(this.root, '', handleThemeGroup);
    }
    toArray() {
        return this.root.children;
    }
}

class Statement {
    constructor(start, end, value) {
        this.start = start;
        this.end = end;
        this.value = value;
    }
    suffix(end, value) {
        this.end = end;
        this.value += value;
    }
    valueOf() {
        return this.value.trim();
    }
    splitProperty() {
        const index = this.value.indexOf(':');
        const key = this.value.slice(0, index);
        const value = this.value.slice(index + 1);
        return { key, value };
    }
    genBranch() {
        return {
            type: 'statement',
            value: this.value,
            start: this.start,
            end: this.end
        };
    }
}

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
        const tree = this.parse();
        return tree.process(this.themePropertyValueHandler);
    }
    parse() {
        const input = this.input;
        let tree = new Tree(this.themeIdentityKeyWord, this.throwLessError);
        let comment = null; // 注释 // 第一个/开头，\n结尾 或者 第一个/开头，然后 * ，... ，最后*，最后/结尾
        let state = null; // 声明或者语句
        let isFindColon = false; // 是否查找到了冒号
        let leftBraceTimes = 0;
        let isFindLeftBraceVariable = false;
        function takeAsState(index, char) {
            if (state) {
                state.suffix(index, char);
            }
            else {
                state = new Statement(index, index, char);
            }
        }
        const addStatement = (addChildren) => {
            if (state) {
                tree.push(state.genBranch(), addChildren);
                state = null;
            }
        };
        const addProperty = (type) => {
            if (state) {
                const value = state.valueOf();
                if (value.length > 3 && value.indexOf(':') > 0 && value.indexOf(':') < value.length - 1) {
                    const { key, value } = state.splitProperty();
                    tree.push({
                        type: type,
                        value: { key, value },
                        start: state.start,
                        end: state.end
                    }, false);
                    isFindColon = false;
                }
                else {
                    this.throwLessError(state.end, 'The less statement has incomplete property value');
                }
            }
            state = null;
        };
        for (let index = 0; index < input.length; index++) {
            const char = input.charAt(index);
            if (comment) {
                const branch = comment.handleChar(index, char);
                if (branch) {
                    if (branch.type.startsWith('comment/')) {
                        addStatement(false);
                        tree.push(branch, false);
                    }
                    else if (branch.type === 'statement') {
                        if (state) {
                            state.suffix(branch.end, branch.value);
                        }
                        else {
                            state = new Statement(branch.start, branch.end, branch.value);
                        }
                    }
                    comment = null;
                }
                continue;
            }
            switch (char) {
                // 可能是注释起始或者语句，如/deep/
                case '/':
                    comment = new Comment(index, char, this.throwLessError);
                    break;
                // 可能是block或者map
                case '{':
                    if (state) {
                        // theme({
                        if (isFindColon) {
                            takeAsState(index, char);
                            leftBraceTimes++;
                            break;
                        }
                        if (input.charAt(index - 1) === '@') {
                            isFindLeftBraceVariable = true;
                            takeAsState(index, char);
                            break;
                        }
                        addStatement(true);
                    }
                    else {
                        this.throwLessError(index, 'Open curly braces cannot be used as the starting statement for less.');
                    }
                    break;
                case '}':
                    if (isFindColon) {
                        // 查找theme({匹配的右半部分
                        if (leftBraceTimes > 0) {
                            takeAsState(index, char);
                            leftBraceTimes--;
                            if (leftBraceTimes === 1) {
                                leftBraceTimes = 0;
                            }
                            break;
                        }
                        addProperty('property/brace');
                        break;
                    }
                    if (isFindLeftBraceVariable) {
                        isFindLeftBraceVariable = false;
                        takeAsState(index, char);
                        break;
                    }
                    addStatement(false);
                    tree.closeChildren();
                    break;
                case ';':
                    // 如果以回车或者;结尾，则整理键值对
                    if (isFindColon && leftBraceTimes === 0) {
                        addProperty('property/colon');
                        break;
                    }
                    takeAsState(index, char);
                    break;
                case '\n':
                    if (isFindColon && leftBraceTimes === 0) {
                        const nextStr = input.slice(index + 1);
                        if (nextStr.indexOf(';') > -1 || nextStr.indexOf('}') > 1) {
                            takeAsState(index, char);
                            break;
                        }
                        else {
                            this.throwLessError(index - 1, 'A semicolon is missing at the end of an attribute.');
                        }
                    }
                    break;
                case ':':
                    // 可能是选择器语句或者属性值后面的冒号
                    // :nth-child(1) :focus  :hover
                    // color:red;
                    // color:theme({white:#dddddd;});
                    // color: red;background-color:theme({white:#dddddd;});
                    if (!isFindColon) {
                        const nextStartIndex = index + 1;
                        const nextStr = input.slice(nextStartIndex);
                        const splits = [nextStr.indexOf(';'), nextStr.indexOf('}'), nextStr.indexOf('\n')].filter(index => index > -1);
                        if (splits.length === 0) {
                            const temp = nextStr.length - 1;
                            if (temp > index) {
                                splits.push(temp);
                            }
                            else {
                                this.throwLessError(index, '冒号后面缺少代码');
                            }
                        }
                        const splitIndex = splits.sort((a, b) => a - b)[0];
                        const leftBraceIndex = nextStr.slice(0, splitIndex).indexOf('{');
                        if (leftBraceIndex === -1 || input.slice(nextStartIndex, nextStartIndex + leftBraceIndex).trim().endsWith('(')) {
                            isFindColon = true;
                            if (leftBraceIndex > -1) {
                                leftBraceTimes = 1; // theme(@{@{variable}});
                            }
                            else {
                                leftBraceTimes = 0;
                            }
                        }
                    }
                    takeAsState(index, char);
                    break;
                default:
                    takeAsState(index, char);
                    break;
            }
        }
        if (comment) {
            const branch = comment.handleNotFilledComment();
            if (branch) {
                tree.push(branch, false);
                comment = null;
            }
        }
        if (state) {
            addStatement(false);
            tree.closeChildren();
        }
        if (leftBraceTimes > 0) {
            this.throwLessError(input.length - 1, 'Incomplete block of statements');
        }
        return tree;
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
