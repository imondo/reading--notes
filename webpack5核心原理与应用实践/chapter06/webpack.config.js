const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.tsx',
    mode: 'none',
    devtool: false,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    devServer: {
        hot: true,
        open: true
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx$/,
          loader: "babel-loader",
          options: {
              presets: [
                [
                  "@babel/preset-react", 
                  {
                    "runtime": "automatic"
                  }
                ],
                '@babel/preset-typescript'
              ],
          }
        },
        {
          test: /\.less$/,
          use: ["style-loader", "css-loader", "less-loader"],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        }
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Webpack App</title>
          </head>
          <body>
            <div id="app" />
          </body>
        </html>`
      })
    ]
  };
  