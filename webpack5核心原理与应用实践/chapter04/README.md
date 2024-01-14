# 构建现代 CSS 工程环境

CSS 代码处理工具：

- `css-loader`、`style-loader`、`mini-css-extract-plugin` 处理原生 CSS 文件

- Less/Sass/Stylus 预处理器

- PostCSS

## 如何处理 CSS 资源

不额外配置，会导致编译失败

Webpack 处理 CSS 文件，需要用到：

- `css-loader`：将 CSS 代码等价翻译为 `module.exports="${css}"` 的 JS 代码，使 webpack 能如同处理 JS 代码一样解析 CSS 内容与资源依赖

- `style-loader`：该 Loader 将在产物中注入一系列 runtime 代码，这些代码会将 CSS 内容注入到页面的 `<style>` 标签中

- `mini-css-extract-plugin`：抽离单独的 `.css` 文件，将文件通过 `<link>` 标签方式插入到页面中

三种 Loader 各司其职

<img />

### css-loader

css-loader 处理 CSS 代码基础能力，包括 CSS 到 JS 转译、依赖解析、Sourcemap、css-in-module

依赖安装

```bash
yarn add -D css-loader
```

定义规则

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['css-loader']
            }
        ]
    }
}
```

执行 npx webpack 或其他构建命令，转译后

```js
// ...
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.hd {
    color: red;
}`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);
// ...
```

`css-loader` 处理后，不会对页面样式影响，接入 `style-loader`，它不会对代码内容做任何修改，而是简单注入运行时代码，将 `css-loader` 转译出的 JS 代码插入到页面的 style 标签

```bash
yarn add -D style-loader css-loader
```

修改配置规则

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
}
```

注意保持顺序，`style-loader` 在前，`css-loader` 在后，语义表示 `style-loader(css-loader(css))` 链式调用，执行后样式代码会被转译。

经过 `style-loader` 和 `css-loader` 处理后，样式代码最终会被写入 Bundle 文件，在运行时通过 style 标签注入到页面，但是存在几个问题：

- JS、CSS 资源无法并行加载，从而降低页面性能

- 资源缓存粒度大，JS、CSS 任意一种变更都会使缓存失效

因此，生产环境通常用 `mini-css-extract-plugin` 插件替代 `style-loader`，将样式代码抽离成单独的 CSS 文件。

```bash
yarn add -D mini-css-extract-plugin
```

添加配置

```js
const HTMLWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
    //...
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
```

注意：

- 需要同时使用 `loader`，`plugin`

- 不能与 `style-loader` 同时混用，否则报错

- 需要与 `html-webpack-plugin` 同时使用，才能将产物路径以 `link` 标签形式插入

## 使用预处理器

在 CSS 上补充扩展逻辑判断，数学运算，嵌套封装等特性，能写出复用性、可读性、可维护性更强，条理与结构更清晰的样式代码。

引入 Loader 即可接入预处理器，以 less 为例：

```bash
yarn add less less-loader
```

修改 webpack 配置

```js
module.export = {
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'less-loader'
                ]
            }
        ]
    }
}
```

社区比较流行的预处理器有：Less、Sass、Stylus，它们的接入方式都差不多。

## post-css

PostCSS 作用和 babel 类似，接入步骤：

```bash
yarn add postcss postcss-loader autoprefixer -D
```

修改配置

```js
module.exports ={
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoader: 1
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [require('autoprefixer')]
                            }
                        }
                    }
                ]
            }
        ]
    }
}
```

也可抽离保存到 `postcss.config.js` 文件

```js
// postcss.config.js
module.exports = {
    plugins: [
        [require('autoprefixer')]
    ]
}

// webpack.config.js
module.exports ={
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoader: 1
                        }
                    },
                    'postcss-loader'
                ]
            }
        ]
    }
}

```

也可以和预处理一起使用

```js
module.exports ={
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            importLoader: 1
                        }
                    },
                    'postcss-loader'，
                    'less-loader'
                ]
            }
        ]
    }
}
```

基于这一特性，我们既能复用预处理语法特性，又能应用 PostCSS 丰富的插件能力处理诸如雪碧图、浏览器前缀等问题。

实际开发经常使用的插件：

- autoprefixer：基于 Can I Use 网站上的数据，自动添加浏览器前缀

- postcss-preset-env：一款将最新 CSS 语言特性转译为兼容性更佳的低版本代码的插件

- postcss-less：兼容 Less 语法的 postcss 插件，类似的有：postcss-sacc、poststylus

- stylelint: 一个现代 CSS 代码风格检查器，能够帮助识别样式代码中的异常或风格问题

## 总结

- webpack 不能理解 CSS 代码，所以需要使用引入 Loader 来处理样式。

- 预处理器可以祢补原生 CSS 的一些功能缺失，如：数值运算、嵌套、代码复用、函数。