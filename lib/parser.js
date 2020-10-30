// const parserInput = require('./utils/parser-input')
const parser = require('./parse-input')
module.exports = function(less) {

    function InlineImages() {
    }

    InlineImages.prototype = {
        process: function (input, { context, imports, fileInfo }){
            return parser(input)
        }
    };
    return InlineImages;
};
