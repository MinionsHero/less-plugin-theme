const parser = require('./parse-input')
module.exports = function (less) {
    function InlineImages() {
    }

    InlineImages.prototype = {
        process: function (input, {context, imports, fileInfo}) {
            return parser(input, {
                throwError:function (index,msg){
                    throw new Error(`${fileInfo.filename}: ${input.slice(index-10,index+10)},${msg}`)
                },
                // throwError: function (index, msg, type) {
                //     throw new less.LessError(
                //         {
                //             index: index,
                //             filename: fileInfo.filename,
                //             type: type || 'Syntax',
                //             message: msg
                //         },
                //         imports,
                //         fileInfo.filename
                //     );
                // }
            })
        }
    };
    return InlineImages;
};
