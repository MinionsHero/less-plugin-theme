const path = require('path');
const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const srcPath = path.resolve(__dirname, '../src')
const testPath = path.resolve(__dirname,'../test')
const publicPath = path.resolve(__dirname, './public')
const distPath = path.resolve(__dirname, './dist')

module.exports = {
    entry: {
        app: path.resolve(__dirname, "./test.ts"),
    },
    output: {
        filename: '[name].js',
        path: distPath,
    },
    devServer: {
        contentBase: './dist',
    },
    mode: 'development',
    devtool: 'inline-source-map',
    resolve: {
        alias: {
            '@': srcPath,
            '@test': testPath
        },
        extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', 'vue', ".ts", '.tsx', '.less'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components|lib)/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.less$/,
                include: [
                    testPath,
                ],
                use: {
                    loader: 'raw-loader',
                },
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(publicPath, './index.html'),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new ProgressBarPlugin(),
        new FriendlyErrorsPlugin(),
    ],
}
