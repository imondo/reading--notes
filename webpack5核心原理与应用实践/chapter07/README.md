# 构建 NPM Library

构建 NPM 库注意：

- 正确导出模块内容

- 不要将第三方包打包进产物，以免与业务环境发生冲突

- 将 CSS 抽离为独立文件，方便用户自行决定实际用法

- 始终生成 sourcemap 文件，方便用户调试

## 开发 NPM 库

初始化项目 test-lib

```bash
mkdir test-lib && cd test-lib
npm init -y
```

安装依赖

```bash
yarn add -D webpack webpack-cli
```

目录

```md
├─ test-lib
│  ├─ package.json
│  ├─ src
│  │  ├─ index.js
```

webpack 配置

```js
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: '_',
            type: 'umd' // 或者 'commonjs2'
        }
    }
}
```

library.name 用于指定全局变量的名称

```html
<!DOCTYPE html>
<html lang="en">
...
<body>
    <script src="https://examples.com/dist/main.js"></script>
    <script>
        // Webpack 会将模块直接挂载到全局对象上
        window._.add(1, 2)
    </script>
</body>

</html>

```
library.type 用于指定打包后的模块类型。

可选值有：commonjs、umd、module、jsonp 等，通常选用兼容性更强的 umd 方案即可。

使用 output.library 前会被包装成一个 IIFE ；而使用后，代码被包装成 UMD(Universal Module Definition) 模式

```js
(function webpackUniversalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["_"] = factory();
    else
        root["_"] = factory();
})(self, function() {
 // ...
});
```

这种形态会在 NPM 库启动时判断运行环境，自动选择当前适用的模块化方案，此后我们就能在各种场景下使用 test-lib 库，例如：

```js
// ES Module
import {add} from 'test-lib';

// CommonJS
const {add} = require('test-lib');

// HTML
<script src="https://examples.com/dist/main.js"></script>
<script>
    // Webpack 会将模块直接挂载到全局对象上
    window._.add(1, 2)
</script>

```

## 使用第三方包

直接使用会导致产物文件体积非常大，因为 webpack 会默认将所有第三方包打入产物中，导致代码冗余。

使用 externals 配置项，将第三方包从打包过程中排除出去，以减小打包体积。

```js
module.exports = {
    // ...
    externals: {
        lodash: {
            commonjs: 'lodash',
            commonjs2: 'lodash',
            amd: 'lodash',
            root: '_'
        }
    }
}
```

Webpack 编译过程会跳过 [externals](https://webpack.js.org/configuration/externals/) 所声明的库，并假定消费场景已经安装了相关依赖，常用于 NPM 库开发场景；在 Web 应用场景下则常被用于优化性能。

主要发生了两个变化：

- 产物仅包含 test-lib 库代码，体积相比修改前大幅降低；
- UMD 模板通过 require、define 函数中引入 lodash 依赖并传递到 factory。

至此，Webpack 不再打包 lodash 代码，我们可以顺手将 lodash 声明为 peerDependencies

```json
{
    "peerDependencies": {
        "lodash": "^4.17.21"
    }
}
```

可以直接使用 [webpack-node-externals](https://www.npmjs.com/package/webpack-node-externals) 排除所有 node_modules 中的第三方包，以减小打包体积。

```js
// webpack.config.js
const nodeExternals = require('webpack-node-externals');

module.exports = {
  // ...
    externals: [nodeExternals()]
  // ...
};

```

## 抽离 CSS 代码

mini-css-extract-plugin 插件抽离成单独文件，由用户自行引入

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // ...
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },
    plugins: [ new MiniCssExtractPlugin()]
}
```

## 生成 Sourcemap

Sourcemap 是一种代码映射协议，它能够将经过压缩、混淆、合并的代码还原回未打包状态，帮助开发者在生产环境中精确定位问题发生的行列位置，所以一个成熟的 NPM 库除了提供兼容性足够好的编译包外，通常还需要提供 Sourcemap 文件。

```js
module.exports = {
    devtool: 'source-map',
}
```

## 其他 NPM 配置

- `.npmignore` 文件忽略不需要发不到 NPM 的文件

- `package.json` 文件中，使用 prepublishOnly 钩子，在发布前执行一些操作，比如执行构建命令

```json
{
    "scripts": {
        "prepublishOnly": "webpack --mode=production"
    }
}
```

- 指定 main 入口文件，同时使用 module 字段指定 ES Module 入口文件

```json
{
  "name": "6-1_test-lib",
  // ...
  "main": "dist/main.js",
  "module": "src/index.js",
  "scripts": {
    "prepublishOnly": "webpack --mode=production"
  },
  // ...
}
```

## 总结

站在 `Webpack` 角度，构建 `Web` 应用于构建 `NPM` 库的差异并不大，开发时注意：

- 使用 `output.library` 配置项，正确导出模块内容；
- 使用 `externals` 配置项，忽略第三方库；
- 使用 `mini-css-extract-plugin` 单独打包 `CSS` 样式代码；
- 使用 `devtool` 配置项生成 `Sourcemap` 文件，这里推荐使用 `devtool = 'source-map'`。