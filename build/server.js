const webpack = require('webpack');
const DevServer = require('webpack-dev-server');
const webpackConfig = require('../webpack.config');
const path = require('path');
const portfinder = require('portfinder');
const open = require('open');
const ip = require('ip')

const publicPath = path.resolve(__dirname, '../demo/public');
const distPath = path.resolve(__dirname, '../dist');
const devConfig = {
    quiet: true, // 开启FriendlyErrorsPlugin必须设置这个为true
    contentBase: [
        distPath,
        publicPath,
    ], //服务基于静态文件夹
    host: '0.0.0.0', // 允许外部ip访问
    useLocalIp: true, // 允许本地ip访问
    hot: true, //开启热加载,必须同时使用webpack.HotModuleReplacementPlugin
    // open: process.platform == 'win32' ? 'Chrome' : 'Google Chrome', //启动后打开Chrome
    overlay: false, //不在页面显示错误
    port: 9000, //端口号
    writeToDisk: (filePath) => {
        return true;
    }, //是否写入硬盘
};

portfinder.getPort({
    port: devConfig.port,
}, function (err, port) {
    if (err) {
        return console.error(err);
    }
    // devServer卸载webpack配置中只能在watch模式起作用,但不能自动启动devServer,
    // 因此必须调用webpackDevServer.listens
    const server = new DevServer(webpack(webpackConfig), devConfig);
    server.listen(port, 'localhost', function () {
        open('http://' + ip.address('private', 'ipv4') + ':' + port);
    });
});