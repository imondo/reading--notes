# 构建性能优化

- 使用缓存与多进程能力提升构建性能
- 减少编译范围，编译步骤提升性能

    - Webpack、Node 版本保持最新
    - 配置 resolve 控制资源搜索范围
    - 针对 npm 包设置 module.noParse 跳过编译步骤

## 最新版本

- V3 到 V4 重写 Chunk 依赖逻辑，将原来的父子树状关系调整为 `ChunkGroup` 表达的有序图关系，提升代码分包效率；
- V4 到 V5 引入 cache 功能，支持将模块、模块关系图、产物等核心要素持久化缓存到硬盘，减少重复工作。

## lazyCompilation 使用

entry 或异步引用模块的按需编译，提升构建性能。

```js
// webpack.config.js
module.exports = {
  // ...
  experiments: {
    lazyCompilation: true,
  },
};

```
启动后，通过异步引用语句如`import('./module')`导入的模块以及未被访问到的 entry 都不会被立即编译，直到页面请求该模块资源时才会开始构建，与 vite 相似，提高冷启动速度

支持参数：

- backend： 设置后端服务信息，一般保持默认值即可；
- entries：设置是否对 entry 启动按需编译特性；
- imports：设置是否对异步模块启动按需编译特性；
- test：支持正则表达式，用于声明对那些异步模块启动按需编译特性。

实验阶段，建议只在**开发环境**使用。

## 约束 Loader 执行范围

> [官网](https://webpack.js.org/configuration/module/#condition)

使用 `module.rules.include`、`module.rules.exclude` 等配置项，限定 `Loader` 的执行范围 ，通过 `and/not/or` 属性配置组合过滤逻辑，如：

```js
const path = require("path");
module.exports = {
  // ...
  module: {
    rules: [{
      test: /\.js$/,
      exclude: {
        and: [/node_modules/],
        not: [/node_modules\/lodash/] // 过滤 node_modules 文件夹中除 lodash 外的所有文件
      },
      use: ["babel-loader", "eslint-loader"]
    }],
  }
};
```

## 使用 noParse 跳过编译步骤

有些资源文件都是独立、内聚的代码片段，没必要重复做代码解析

```js
// webpack.config.js
module.exports = {
  //...
  module: {
    noParse: /lodash|react/,
  },
};
```

> noParse 支持正则、函数、字符串、字符串数组等参数形式，具体可查阅[官网](https://webpack.js.org/configuration/module/#modulenoparse)。

使用注意：

- 由于跳过了前置的 `AST` 分析动作，构建过程无法发现文件中可能存在的语法错误，需要到运行（或 Terser 做压缩）时才能发现问题，所以必须确保 `noParse` 的文件内容正确性

- 由于跳过了依赖分析的过程，所以文件中，建议不要包含 `import/export/require/define` 等模块导入导出语句 —— 换句话说，`noParse` 文件不能存在对其它文件的依赖，除非运行环境支持这种模块化方案

- 由于跳过了内容分析过程，`Webpack` 无法标记该文件的导出值，也就无法实现 `Tree-shaking`

建议在使用 `noParse` 配置 `NPM` 库前，先检查 `NPM` 库默认导出的资源满足要求，例如 React@18 默认定义的导出文件是 `index.js`：

```js
// react package.json
{
  "name": "react",
  // ...
  "main": "index.js"
}
```

但 `node_module/react/index.js` 文件包含了模块导入语句 `require`：

```js
// node_module/react/index.js
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react.production.min.js');
} else {
  module.exports = require('./cjs/react.development.js');
}
```

真正有效的代码被包含在 `react.development.js`（或 `react.production.min.js`）中，但 `Webpack` 只会打包这段 `index.js` 内容，也就造成了产物中实际上并没有真正包含 `React`。针对这个问题，我们可以先找到适用的代码文件，然后用 `resolve.alias` 配置项重定向到该文件。

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    noParse: /react|lodash/,
  },
  resolve: {
    alias: {
      react: path.join(
        __dirname,
        process.env.NODE_ENV === "production"
          ? "./node_modules/react/cjs/react.production.min.js"
          : "./node_modules/react/cjs/react.development.js"
      ),
    },
  },
};
```

> 提示：使用 [externals](https://webpack.js.org/configuration/externals/) 也能将部分依赖放到构建体系之外，实现与 noParse 类似的效果。

## 开发模式禁用产物优化

开发模式下建议关闭这一类优化功能，具体措施：

- 确保 `mode='development'` 或 `mode = 'none'`，关闭默认优化策略；
- `optimization.minimize` 保持默认值或 `false`，关闭代码压缩；
- `optimization.concatenateModules` 保持默认值或 `false`，关闭模块合并；
- `optimization.splitChunks` 保持默认值或 `false`，关闭代码分包；
- `optimization.usedExports` 保持默认值或 `false`，关闭 `Tree-shaking` 功能；

```js
module.exports = {
  // ...
  mode: "development",
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    minimize: false,
    concatenateModules: false,
    usedExports: false,
  },
};
```

## 最小化 watch 监控访问

在 `watch` 模式下（通过 `npx webpack --watch` 命令启动），可以设置 `watchOptions.ignored` 属性忽略这些文件

```js
// webpack.config.js
module.exports = {
  //...
  watchOptions: {
    ignored: /node_modules/
  },
};
```

## 跳过 TS 类型检查

```js
module.exports = {
  // ...
  module: {
    rules: [{
      test: /\.ts$/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            // 设置为“仅编译”，关闭类型检查
            transpileOnly: true
          }
        }
      ],
    }],
  }
};
```

- 借助编辑器的 `TypeScript` 插件实现代码检查；
- 使用 `fork-ts-checker-webpack-plugin` 插件将类型检查能力剥离到子进程执行

```js
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  // ...
  module: {
    rules: [{
      test: /\.ts$/,
      use: [
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        }
      ],
    }, ],
  },
  plugins:[
    // fork 出子进程，专门用于执行类型检查
    new ForkTsCheckerWebpackPlugin()
  ]
};

```

## 优化 ESLint 性能

使用新版本组件 `eslint-webpack-plugin` 替代旧版 `eslint-loader`，两者差异在于，`eslint-webpack-plugin` 在模块构建完毕（`compilation.hooks.succeedModule` 钩子）后执行检查，不会阻断文件加载流程，性能更优

```bash
yarn add -D eslint-webpack-plugin
```

```js
const ESLintPlugin = require('eslint-webpack-plugin');
module.exports = {
  // ...
  plugins: [new ESLintPlugin(options)],
  // ...
};

```

## 慎用 source-map

`source-map` 是一种将经过编译、压缩、混淆的代码映射回源码的技术，它能够帮助开发者迅速定位到更有意义、更结构化的源码中，方便调试。

针对 `source-map` 功能，`Webpack` 提供了 `devtool` 选项，可以配置 `eval`、`source-map`、`cheap-source-map` 等值，不考虑其它因素的情况下，最佳实践：

开发环境使用 `eval` ，确保最佳编译速度；
生产环境使用 `source-map`，获取最高质量。

## 设置 resolve 缩小搜索范围

增强资源搜索体验的特性背后涉及许多 IO 操作，本身可能引起较大的性能消耗，开发者可根据实际情况调整 `resolve` 配置，缩小资源搜索范围

### resolve.extensions 配置

`resolve.extensions` 默认值为 `['.js', '.json', '.wasm']` ，这意味着 Webpack 在针对不带后缀名的引入语句时，可能需要执行三次判断逻辑才能完成文件搜索，针对这种情况，可行的优化措施包括：

- 修改 `resolve.extensions` 配置项，减少匹配次数；
- 代码中尽量补齐文件后缀名；
- 设置 `resolve.enforceExtension = true` ，强制要求开发者提供明确的模块后缀名，不过这种做法侵入性太强，不太推荐。

### resolve.modules 配置

当 Webpack 遇到 `import 'lodash'` 这样的 `npm` 包导入语句时，会先尝试在当前项目 `node_modules` 目录搜索资源

通过修改 `resolve.modules` 配置项，主动关闭逐层搜索功能

```js
// webpack.config.js
const path = require('path');

module.exports = {
  //...
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules')],
  },
};
```

### resolve.mainFiles 配置

与 `resolve.extensions` 类似，`resolve.mainFiles` 配置项用于定义文件夹默认文件名，例如对于 `import './dir'` 请求，假设 `resolve.mainFiles = ['index', 'home']` ，Webpack 会按依次测试 `./dir/index` 与 `./dir/home` 文件是否存在。

因此，实际项目中应控制 `resolve.mainFiles` 数组数量，减少匹配次数。