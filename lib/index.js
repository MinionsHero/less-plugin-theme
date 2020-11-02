const parser = require("./parser");

function LessPluginTheme(options) {
    this.options = options;
}

LessPluginTheme.prototype = {
    install: function (less, pluginManager) {
        let InlineImages = parser(less);
        pluginManager.addPreProcessor(new InlineImages());
    },
    minVersion: [2, 1, 0]
};

module.exports = LessPluginTheme;
