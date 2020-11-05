const path = require('path');
const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const srcPath = path.resolve(__dirname, 'src')
const publicPath = path.resolve(__dirname, 'demo/public')
const distPath = path.resolve(__dirname, 'dist')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const
    SASS = 'sass',
    LESS = 'less',
    CSS = 'css',
    STYLUS = 'stylus',
    STYLE = 'style',
    POSTCSS = 'postcss'

const createLoader = function (name, config = {}) {
    let loaderMap = new Map()
    let loaderNames = [STYLE, CSS, POSTCSS, LESS, SASS, STYLUS]
    // 生成不同的loader
    loaderNames.forEach(function (name) {
        loaderMap.set(name, {
            loader: name + "-loader",
            options: Object.assign({}, config[name]),
        })
    })
    // 验证name的合法性
    let validNames = [SASS, LESS, CSS, STYLUS]
    if (!validNames.includes(name)) {
        throw new Error(name + ' is not a valid name')
    }
    let test = name, use = [loaderMap.get(STYLE), loaderMap.get(CSS), loaderMap.get(POSTCSS)]
    // 允许插入钩子调用
    if (typeof config.beforeHook === 'function') {
        use.unshift(config.beforeHook(use))
    }
    if (typeof config.afterHook === 'function') {
        use.unshift(config.afterHook(use))
    }
    // 配置loader
    switch (name) {
        case SASS:
            test = '(scss|sass)';
            break;
        case STYLUS:
            test = 'styl';
            break;
        default:
            test = name;
            break;
    }
    switch (name) {
        case LESS:
            use.push(loaderMap.get(LESS))
            break;
        case SASS:
            use.push(loaderMap.get(SASS))
            break;
        case STYLUS:
            use.push(loaderMap.get(STYLUS))
            break;
    }
    return {
        test: new RegExp('\\.' + test + '$'),
        use: use,
    }
}

module.exports = {
    entry: {
        app: path.resolve(process.cwd(), "demo/main.ts"),
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
            'lib': path.resolve(process.cwd(), './lib/'),
            '@components': path.resolve(srcPath, './components/'),
            '@views': path.resolve(srcPath, './views/'),
            '@assets': path.resolve(srcPath, './assets/'),
            '@images': path.resolve(srcPath, './assets/images/'),
            '@styles': path.resolve(srcPath, './assets/styles/'),
            '@fonts': path.resolve(srcPath, './assets/fonts/'),
            '@jsons': path.resolve(srcPath, './assets/jsons/'),
            '@store': path.resolve(srcPath, './store/'),
            '@routes': path.resolve(srcPath, './routes/'),
            '@utils': path.resolve(srcPath, './utils/'),
            '@layouts': path.resolve(srcPath, './layouts/'),
            '@': srcPath,
            'vue$': 'vue/dist/vue.esm.js'
        },
        extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', 'vue'],
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
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
                test: /\.json$/,
                use: {
                    loader: 'json-loader',
                },
            },
            {
                test: /\.(png|jpe?g|gif|)$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 1024 * 8,
                    },
                },
            },
            {
                test: /\.(woff|woff2|eot|otf)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        publicPath: 'assets',
                        name: '[name].[hash].[ext]',
                    },
                },
            },
            {
                test: /\.svg$/,
                include: [
                    path.resolve(srcPath, './assets/fonts'),
                ],
                use: {
                    loader: 'file-loader',
                    options: {
                        publicPath: 'assets',
                        name: '[name].[hash].[ext]',
                    },
                },
            },
            {
                test: /\.svg$/,
                include: [
                    path.resolve(srcPath, './assets/images'),
                ],
                use: {
                    loader: 'svg-sprite-loader',
                },
            },
            createLoader(CSS),
            createLoader(LESS),
            createLoader(SASS),
            createLoader(STYLUS),
        ],
    },
    plugins: [
        new VueLoaderPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(publicPath, './index.html'),
        }),
        new webpack.HotModuleReplacementPlugin(),
        new ProgressBarPlugin(),
        new FriendlyErrorsPlugin(),
    ],
}