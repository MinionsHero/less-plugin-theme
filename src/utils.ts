interface Stylize {
    (input: string, type: string): string
}

function getLocation(index: number, inputStream: string) {
    let n = index + 1;
    let column = -1;
    while (--n >= 0 && inputStream.charAt(n) !== '\n') {
        column++;
    }
    const match = inputStream.slice(0, index).match(/\n/g)
    const line = match ? match.length : -1
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
    message: string
    private filename: string
    private input: string
    private line: number
    private column: number
    private callLine: number
    private callExtract: string
    private extract: [string, string, string]

    constructor(message: string, index: number, filename: string, input: string) {
        super(message);
        this.message = message
        this.filename = filename
        this.input = input
        const {line, column} = getLocation(index, input)
        this.line = line
        this.column = column
        // @ts-ignore
        const callLine = this.call && getLocation(this.call, input).line;
        const lines = input ? input.split('\n') : '';
        if (this.line === -1 && this.stack) {
            const found = this.stack.match(anonymousFunc);
            const func = new Function('a', 'throw new Error()');
            let lineAdjust = 0;
            try {
                func();
            } catch (e) {
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
        let error: string[] = [];
        let errorStr: string = ''
        let stylize: Stylize = (str) => str;
        if (this.line !== null) {
            if (typeof extract[0] === 'string') {
                error.push(stylize(`${this.line - 1} ${extract[0]}`, 'grey'));
            }

            if (typeof extract[1] === 'string') {
                let errorTxt = `${this.line} `;
                if (extract[1]) {
                    errorTxt += extract[1].slice(0, this.column) +
                        stylize(stylize(stylize(extract[1].substr(this.column, 1), 'bold') +
                            extract[1].slice(this.column + 1), 'red'), 'inverse');
                }
                error.push(errorTxt);
            }

            if (typeof extract[2] === 'string') {
                error.push(stylize(`${this.line + 1} ${extract[2]}`, 'grey'));
            }
            errorStr = `${error.join('\n') + stylize('', 'reset')}\n`;
        }

        message += stylize(`${'Syntax'} Error: ${this.message}`, 'red');
        if (this.filename) {
            message += stylize(' in ', 'red') + this.filename;
        }
        if (this.line) {
            message += stylize(` on line ${this.line}, column ${this.column + 1}:`, 'grey');
        }

        message += `\n${errorStr}`;

        if (this.callLine) {
            message += `${stylize('from ', 'red') + (this.filename || '')}/n`;
            message += `${stylize(this.callLine + '', 'grey')} ${this.callExtract}/n`;
        }

        return message;
    }
}

export interface ThrowLessErrorFunc {
    (index: number, message: string): never
}

export default function ErrorUtil(filename: string, input: string) {
    return {
        throwLessError(index, message) {
            throw new Error(new LessError(message, index, filename, input).toString())
        }
    }
}
