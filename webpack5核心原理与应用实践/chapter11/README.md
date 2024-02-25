# 深入理解 Webpack 核心配置

## 配置结构

- 单文件导出单个配置对象

```js
module.exports = {
  entry: './src/index.js',
  // 其它配置...
};

```

- 数组导出多个配置对象

```js
// webpack.config.js
module.exports = [{
  entry: './src/index.js',
  // 其它配置...
}, {
  entry: './src/index.js',
  // 其它配置...
}];

```

使用数组方式，webpack 会启动后创建多个 `Compilation` 实例，并行构建工作。

但需要注意，`Compilation` 实例间基本上不作通讯，这意味着这种并行构建对运行性能并没有任何正向收益，例如某个 `Module` 在 `Compilation` 实例 A 中完成解析、构建后，在其它 `Compilation` 中依然需要完整经历构建流程，无法直接复用结果。

数组方式主要用于应对“同一份代码打包出多种产物”的场景，例如在构建 Library 时，我们通常需要同时构建出 ESM/CMD/UMD 等模块方案的产物，如：

```js
// webpack.config.js
module.exports = [
  {
    output: {
      filename: './dist-amd.js',
      libraryTarget: 'amd',
    },
    name: 'amd',
    entry: './app.js',
    mode: 'production',
  },
  {
    output: {
      filename: './dist-commonjs.js',
      libraryTarget: 'commonjs',
    },
    name: 'commonjs',
    entry: './app.js',
    mode: 'production',
  },
];
```

> 使用配置数组时，还可以通过 --config-name 参数指定需要构建的配置对象，例如上例配置中若执行 npx webpack --config-name='amd'，则仅使用数组中 name='amd' 的项做构建。

此时适合使用配置数组方式解决；若是“多份代码打包多份产物”的场景，使用 `entry` 配置多个应用入口。

`webpack-merge` 工具简化配置逻辑

```js
const { merge } = require("webpack-merge");

const baseConfig = {
  output: {
    path: "./dist"
  },
  name: "amd",
  entry: "./app.js",
  mode: "production",
};

module.exports = [
  merge(baseConfig, {
    output: {
      filename: "[name]-amd.js",
      libraryTarget: "amd",
    },
  }),
  merge(baseConfig, {
    output: {
      filename: "./[name]-commonjs.js",
      libraryTarget: "commonjs",
    },
  }),
];
```

- 配置函数

配置函数方式要求在配置文件中导出一个函数，并在函数中返回 `Webpack` 配置对象，或配置数组，或 `Promise` 对象

```js
module.exports = function(env, argv) {
  // ...
  return {
    entry: './src/index.js',
    // 其它配置...
  }
}
```

运行时，`Webpac`k 会传入两个环境参数对象

- `env`：通过 `--env` 传递的命令行参数，适用于自定义参数

| 命令：   |      env 参数值：      |
|----------|:-------------:|
|npx webpack --env prod|{ prod: true }|
|npx webpack --env prod --env min|{ prod: true, min: true }|
|npx webpack --env platform=app --env production|{ platform: "app", production: true }|
|npx webpack --env foo=bar=app|{ foo: "bar=app"}|
|npx webpack --env app.platform="staging" --env app.name="test"|{ app: { platform: "staging", name: "test" }|

- `argv`：命令行 [Flags](https://webpack.js.org/api/cli/#flags) 参数，支持 `entry/output-path/mode/merge`

“配置函数”这种方式的意义在于，允许用户根据命令行参数动态创建配置对象，可用于实现简单的多环境治理策略，例如：

```js
// npx webpack --env app.type=miniapp --mode=production
module.exports = function (env, argv) {
  return {
    mode: argv.mode ? "production" : "development",
    devtool: argv.mode ? "source-map" : "eval",
    output: {
      path: path.join(__dirname, `./dist/${env.app.type}`,
      filename: '[name].js'
    },
    plugins: [
      new TerserPlugin({
        terserOptions: {
          compress: argv.mode === "production", 
        },
      }),
    ],
  };
};
```

## 环境治理策略

- 开发环境：使用 webpack-dev-server 进行热更新
- 测试环境：需要带上完整的 soucemap 内容，帮助更好的定位问题
- 生产环境：需要尽可能打包出更快、更小、更好的应用代码，确保用户体验

```md
.
└── config
  ├── webpack.common.js
  ├── webpack.development.js
  ├── webpack.testing.js
  └── webpack.production.js

```

配合 `--config` 选项指定配置目标

```bash
npx webpack --config webpack.development.js
```

使用 webpack-merge 合并配置

```bash
yarn add -D webpack-merge
```


```js
// webpack.common.js
const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: { main: "./src/index.js" },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["babel-loader"],
      },
    ],
  },
  plugins: [new HTMLWebpackPlugin()],
};

```

合并配置


```js
// webpack.development.js
const { merge } = require("webpack-merge");
const baseConfig = require("./webpack.common");

// 使用 webpack-merge 合并配置对象
module.exports = merge(baseConfig, {
  mode: "development",
  devtool: "source-map",
  devServer: { hot: true },
});

```

## 核心配置项汇总

![分类](%E5%88%86%E7%B1%BB.png)

- 流程配置
- 性能优化类配置
- 日志类配置
- 开发效率类配置

重点配置

- entry: 项目入口文件
- output：构建结果的存放位置
- target: 配置构建编译产物的目标运行环境，支持 web、node、electron，不同产物会有差异
- mode: 编译模式，development 和 production
- optimization: 控制如何优化产物包体积，Dead Code Elimination、Scope Hoisting、代码混淆、代码压缩
- module: 配置如何处理模块，如 css、less、图片、字体等
- plugin: 配置如何处理插件，如 html、clean、copy、fork-ts-checker

## entry 配置

配置规则，支持：

- 字符串：入口文件为字符串，如 `entry: './src/index.js'`
- 对象：多入口，如 `entry: { main: './src/index.js', sub: './src/sub.js' }`
- 函数：动态获取入口，函数中可返回字符串，对象和数组
- 数组：多入口，如 `entry: ['./src/index.js', './src/sub.js']`

```js
module.exports = {
  //...
  entry: {
    // 字符串形态
    home: './home.js',
    // 数组形态
    shared: ['react', 'react-dom', 'redux', 'react-redux'],
    // 对象形态
    personal: {
      import: './personal.js',
      filename: 'pages/personal.js',
      dependOn: 'shared',
      chunkLoading: 'jsonp',
      asyncChunks: true
    },
    // 函数形态
    admin: function() {
      return './admin.js';
    }
  },
};
```

对象形态配置属性：

- `import`：入口文件路径，支持路径字符串或路径数组
- `dependOn`：声明该入口的前置依赖 `Bundle`
- `runtime`：设置改入口的 `runtime chunk`，若该属性不为空，`webpack` 会将该入口的运行时代码抽离成单独的 `Bundle`
- `filename`：设置该入口的文件名，支持 [name]、[hash]、[chunkhash] 占位符，同 `outout.filename`
- `library`：设置该入口的 `library` 配置，支持 [name]、[local]、[global] 占位符，同 `output.library`
- `publicPath`：设置该入口的 `publicPath` 配置，同 `output.publicPath`
- `chunkLoading`：设置该入口的 `chunk loading` 方式，支持 `jsonp`、`import`、`eager`、`false`；同 `output.chunkLoading`
- `asyncChunks`：设置该入口的 `chunk` 是否异步加载，默认 `true`，同 `output.asyncChunks`

> entry.dependOn 声明入口依赖

dependOn 属性用于声明前置 Bundle 依赖，可以减少重复代码，优化构建产物质量

```js
module.exports = {
  // ...
  entry: {
    main: "./src/index.js",
    foo: { import: "./src/foo.js", dependOn: "main" },
  },
};
```

`dependOn` 适用于哪些有明确入口依赖的场景，例如我们构建了一个主框架 `Bundle`，其中包含了项目基本框架(如 React)，之后还需要为每个页面单独构建 Bundle，这些页面代码也都依赖于主框架代码，此时可用 `dependOn` 属性优化产物内容，减少代码重复。

> entry.runtime 管理运行时代码

为支持产物代码在各种环境中正常运行，Webpack 会在产物文件中注入一系列运行时代码，用以支撑起整个应用框架。运行时代码的多寡取决于我们用到多少特性，例如：

- 需要导入导出文件时，将注入 `__webpack_require__.r` 等；
- 使用异步加载时，将注入 `__webpack_require__.l` 等；
- 等等。

运行时代码量，极端情况下甚至有可能超过业务代码总量。使用 `runtime` 配置将运行时抽离为独立 `Bundle`

```js
const path = require("path");

module.exports = {
  mode: "development",
  devtool: false,
  entry: {
    main: { import: "./src/index.js", runtime: "common-runtime" },
    foo: { import: "./src/foo.js", runtime: "common-runtime" },
  },
  output: {
    clean: true,
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
};
```

## output 声明输出方式

webpack 的 output 配置项用于声明：如何输出构建结果，如产物放在什么地方、文件名是什么、文件编码等

- output.path：声明产物放在什么文件目录下
- output.filename：声明产物文件名规则，支持 [name]/[hash]等占位符
- output.publicPath：文件发布路径
- output.clean：构建前清理指定目录
- output.library：声明产物以何种方式导出
- output.chunkLoading：声明加载异步模块的技术方案，支持 `false/jsonp/require` 等方式。

## target 构建目标

支持构建应用

- Web
- Node
- Electron
- NW.js
- WebWorker

> 示例[代码](https://github1s.com/Tecvan-fe/webpack-book-samples/blob/main/target-node-web/webpack.config.js

## mode 短语

内置构建优化策略

- `production`：默认值，生产模式，使用该值时 `Webpack` 会自动帮我们开启一系列优化措施：`Three-Shaking`、`Terser` 压缩代码、`SplitChunk` 提起公共代码，通常用于生产环境构建；
- `development`：开发模式，使用该值时 `Webpack` 会保留更语义化的 `Module` 与 `Chunk` 名称，更有助于调试，通常用于开发环境构建；
- `none`：关闭所有内置优化规则。