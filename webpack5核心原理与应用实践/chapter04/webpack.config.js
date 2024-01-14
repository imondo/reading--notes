const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
                use: [(process.env.NODE_ENV == 'development' ? 'style-loader' : MiniCssExtractPlugin.loader), 'css-loader']
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new HTMLWebpackPlugin(),
    ]
}