var parser = require("./parser");

module.exports = {
    install: function(less, pluginManager) {
        var InlineImages = parser(less);
        pluginManager.addPreProcessor(new InlineImages());
    }
};
