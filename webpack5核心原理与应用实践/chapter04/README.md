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

注意保持顺序，`style-loader` 在前，`css-loader` 在后，语义表示 `style-loader(css-loader(css))` 链式调用，执行后样式代码会被转译