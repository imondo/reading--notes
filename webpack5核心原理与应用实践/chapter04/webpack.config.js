const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
module.exports = {
    entry: './src/index.js',
    mode: 'development',
    devtool: false,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin()
    ]
}