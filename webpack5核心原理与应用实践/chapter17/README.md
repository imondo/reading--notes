# 代码压缩的门道

在不动代码功能的前提下，删除所有不必要的字符（备注，变量名压缩，逻辑语句合并），减少代码体积，降低网络通讯，提升页面启动速度，优化用户体验。

## 代码压缩原理

精简则适当牺牲可读性，语义，优雅度而力求最少字符数方式书写代码。

```js
const name = '张三';
```

变量，空格，定义改成

```js
let a='张三';
```

先将字符串形态的代码转换为结构化、容易分析处理的 AST（抽象语法树）形态，之后在 AST 上应用上面的规则做各种语法、语义、逻辑推理与简化替换，最后按精简过的 AST 生成结果代码

## TerserWebpackPlugin 压缩 JS

Webpack5.0 后默认使用 [Terser](https://github.com/terser/terser) 作为 JavaScript 代码压缩器，简单用法只需通过 optimization.minimize 配置项开启压缩功能即可

```js
module.exports = {
  //...
  optimization: {
    minimize: true
  }
};
```

> 使用 mode = 'production' 启动生产模式构建时，默认也会开启 Terser 压缩

Terser 支持许多压缩[配置](https://github.com/terser/terser#compress-options)：

- `dead_code`：是否删除不可触达的代码 —— 也就是所谓的死代码；
- `booleans_as_integers`：是否将 `Boolean` 值字面量转换为 0、1；
- `join_vars`：是否合并连续的变量声明，如 `var a = 1; var b = 2`; 合并为 `var a=1,b=2`;

必要时也可以手动创建 [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) 实例并传入压缩配置实现更精细的压缩功能

```js
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  // ...
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            reduce_vars: true,
            pure_funcs: ["console.log"],
          },
          // ...
        },
      }),
    ],
  },
};
```

> Webpack4 默认使用 [uglifyjs-webpack-plugin](https://www.npmjs.com/package/uglifyjs-webpack-plugin) 压缩代码，也可以通过 minimizer 数组替换为 Terser 插件。

`terser-webpack-plugin` [配置项](https://www.npmjs.com/package/terser-webpack-plugin#options)

- `test`：只有命中该配置的产物路径才会执行压缩
- `include`：在该范围内的产物才会执行压缩
- `exclude`：与 `include` 相反，不在该范围内的产物才会执行压缩
- `parallel`：是否启动并行压缩，默认值为 true，此时会按 `os.cpus().length - 1` 启动若干进程并发执行
- `minify`：用于配置压缩器，支持传入自定义压缩函数，也支持 `swc/esbuild/uglifyjs` 等值
- `terserOptions`：传入 `minify` —— “压缩器”函数的配置参
- `extractComments`：是否将代码中的备注抽取为单独文件，可配合特殊备注如 `@license` 使用

1. 可以通过 `test/include/exclude` 过滤插件的执行范围，这个功能配合 `minimizer` 的数组特性，可以实现针对不同产物执行不同的压缩策略

```js
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: { foo: "./src/foo.js", bar: "./src/bar.js" },
  output: {
    filename: "[name].js",
    // ...
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /foo\.js$/i,
        extractComments: "all",
      }),
      new TerserPlugin({
        test: /bar\.js/,
        extractComments: false,
      }),
    ],
  },
};

```

> [示例](https://github.com/Tecvan-fe/webpack-book-samples/blob/main/minify-terser/package.json)代码

示例中，针对 `foo.js` 产物文件会执行 `exctractComments` 逻辑，将备注信息抽取为单独文件；而针对 `bar.js`，由于 `extractComments = false`，不单独抽取备注内容

2. `terser-webpack-plugin` 插件支持使用 `SWC`、`UglifyJS`、`ESBuild` 作为压缩器，使用时只需要通过 `minify` 参数切换即可

```js
module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.swcMinify,
        // `terserOptions` 将被传递到 `swc` (`@swc/core`) 工具
        // 具体配置参数可参考：https://swc.rs/docs/config-js-minify
        terserOptions: {},
      }),
    ],
  },
};
```

内置如下压缩器：

- `TerserPlugin.terserMinify`：依赖于 `terser` 库；
- `TerserPlugin.uglifyJsMinify`：依赖于 `uglify-js`，需要手动安装 `yarn add -D uglify-js`；
- `TerserPlugin.swcMinify`：依赖于 `@swc/core`，需要手动安装 `yarn add -D @swc/core`；
- `TerserPlugin.esbuildMinify`：依赖于 `esbuild`，需要手动安装 `yarn add -D esbuild`。

## CssMinimizerWebpackPlugin 压缩 CSS

```css
h1::before,
h1:before {
  /* 下面各种备注都可以删除 */
  /* margin 值可简写 */
  margin: 10px 20px 10px 20px; 
  /* 颜色值也可以简写 */
  color: #ff0000; 
  /* 删除重复属性 */
  font-weight: 400;
  font-weight: 400; 
  /* position 字面量值可简化为百分比 */
  background-position: bottom right;
  /* 渐变参数可精简 */
  background: linear-gradient(
    to bottom,
    #ffe500 0%,
    #ffe500 50%,
    #121 50%,
    #121 100%
  ); 
  /* 初始值也可精简 */
  min-width: initial;
}
```

述代码就有不少地方可以精简优化，使用 [cssnano](https://cssnano.co/) 压缩后大致上可简化为

```css
h1:before {
  margin: 10px 20px;
  color: red;
  font-weight: 400;
  background-position: 100% 100%;
  quotes: "«" "»";
  background: linear-gradient(180deg, #ffe500, #ffe500 50%, #121 0, #121);
  min-width: 0;
}
```

```bash
yarn add -D css-minimizer-webpack-plugin
```

修改配置

```js
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  //...
  module: {
    rules: [
      {
        test: /.css$/,
        // 注意，这里用的是 `MiniCssExtractPlugin.loader` 而不是 `style-loader`
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      // Webpack5 之后，约定使用 `'...'` 字面量保留默认 `minimizer` 配置
      "...",
      new CssMinimizerPlugin(),
    ],
  },
  // 需要使用 `mini-css-extract-plugin` 将 CSS 代码抽取为单独文件
  // 才能命中 `css-minimizer-webpack-plugin` 默认的 `test` 规则
  plugins: [new MiniCssExtractPlugin()],
};
```

`css-minimizer-webpack-plugin` 也支持 `test`、`include`、`exclude`、`minify`、`minimizerOptions` 配置，其中 `minify` 支持

- `CssMinimizerPlugin.cssnanoMinify`：默认值，使用 `cssnano` 压缩代码，不需要额外安装依赖
- `CssMinimizerPlugin.cssoMinify`：使用 `csso` 压缩代码，需要手动安装依赖 `yarn add -D csso`
- `CssMinimizerPlugin.cleanCssMinify`：使用 `clean-css` 压缩代码，需要手动安装依赖 `yarn add -D clean-css`
- `CssMinimizerPlugin.esbuildMinify`：使用 `ESBuild` 压缩代码，需要手动安装依赖 `yarn add -D esbuild`；
- `CssMinimizerPlugin.parcelCssMinify`：使用 `parcel-css` 压缩代码，需要手动安装依赖 `yarn add -D @parcel/css`

## HtmlMinifierTerser 压缩 HTML

[html-minifier-terser](https://github.com/terser/html-minifier-terser) 是一个基于 JavaScript 实现的、高度可配置的 HTML 压缩器，支持一系列 压缩特性 如

- `collapseWhitespace`：删除节点间的空字符串

```html
<!-- 原始代码： -->
<div> <p>    foo </p>    </div>
<!-- 经过压缩的代码： -->
<div><p>foo</p></div>

```

- `removeComments`：删除备注

```html
<!-- 原始代码： -->
<!-- some comment --><p>blah</p>

<!-- 经过压缩的代码： -->
<p>blah</p>

```

- `collapseBooleanAttributes`：删除 HTML 的 `Boolean` 属性值

```html
<!-- 原始代码： -->
<input value="foo" readonly="readonly">

<!-- 经过压缩的代码： -->
<input value="foo" readonly>
```

`html-minimizer-webpack-plugin` 插件接入 `html-minifier-terser` 压缩器

```bash
yarn add -D html-minimizer-webpack-plugin
```

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");

module.exports = {
  // ...
  optimization: {
    minimize: true,
    minimizer: [
      // Webpack5 之后，约定使用 `'...'` 字面量保留默认 `minimizer` 配置
      "...",
      new HtmlMinimizerPlugin({
        minimizerOptions: {
          // 折叠 Boolean 型属性
          collapseBooleanAttributes: true,
          // 使用精简 `doctype` 定义
          useShortDoctype: true,
          // ...
        },
      }),
    ],
  },
  plugins: [
    // 简单起见，这里我们使用 `html-webpack-plugin` 自动生成 HTML 演示文件
    new HtmlWebpackPlugin({
      templateContent: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>webpack App</title>
      </head>
      <body>
        <input readonly="readonly"/>
        <!-- comments -->
        <script src="index_bundle.js"></script>
      </body>
    </html>`,
    }),
  ],
};
```