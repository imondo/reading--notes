const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
    entry: './src/main.js',
    mode: 'none',
    devtool: false,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
          {
            test: /\.vue$/,
            use: ["vue-loader"],
          },
          {
            test: /\.css$/,
            use: ["css-loader"],
          },
        ],
      },
      plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
          templateContent: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Webpack App</title>
              </head>
              <body>
                <div id="app" />
              </body>
            </html>
                `,
        }),
      ],
}