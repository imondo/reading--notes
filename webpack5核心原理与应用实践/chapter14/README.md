# Webpack 并行构建

Node.js 单线程的特性决定了它无法实现并行构建。为了利用多核 CPU 的能力，Webpack 提供了多种方式来并行构建。

- [HappyPack](https://github.com/amireh/happypack)：多进程方式运行资源加载 Loader 逻辑
- Thread-loader：多进程方式运行资源加载，官方出品
- Parallel-Webpack: 多进程方式运行多个 Webpack 构建实例
- TerserWebpackPlugin：多进程方式执行代码压缩、Uglify 功能

## HappyPack

```bash
yarn add -D happypack
```

将原有 `loader` 配置替换为 `happypack/loader`

```js
const os = require('os')
const HappyPack = require('happypack');
const happyThreadPool = HappyPack.ThreadPool({
  // 设置进程池大小
  size: os.cpus().length - 1
});

module.exports = {
  // ...
  module: {
    rules: [{
        test: /\.js?$/,
        // 使用 `id` 参数标识该 Loader 对应的 HappyPack 插件示例
        use: 'happypack/loader?id=js'
      },
      {
        test: /\.less$/,
        use: 'happypack/loader?id=styles'
      },
    ]
  },
  plugins: [
    new HappyPack({
      // 注意这里要明确提供 id 属性
      id: 'js',
      // 设置共享进程池
      threadPool: happyThreadPool,
      loaders: ['babel-loader', 'eslint-loader']
    }),
    new HappyPack({
      id: 'styles',
      // 设置共享进程池
      threadPool: happyThreadPool,
      loaders: ['style-loader', 'css-loader', 'less-loader']
    })
  ]
};

```

`HappyPack` 虽然确实能有效提升 `Webpack` 的打包构建速度，仍存在缺点：

- 明确表示不会继续维护，扩展性与稳定性缺乏保障
- `HappyPack` 底层以自己的方式重新实现了加载器逻辑，源码与使用方法都不如 `Thread-loader` 清爽简单，而且会导致一些意想不到的兼容性问题
- `HappyPack` 主要作用于文件加载阶段，并不会影响后续的产物生成、合并、优化等功能，性能收益有限

## Thread-loader

与 `HappyPack` 功能类似，主要区别：

- `Thread-loader` 由 `Webpack` 官方提供，目前还处于持续迭代维护状态，理论上更可靠；
- `Thread-loader` 只提供了一个 `Loader` 组件，用法简单很多；
- `HappyPack` 启动后会创建一套 `Mock` 上下文环境 —— 包含 `emitFile` 等接口，并传递给 `Loader`，因此对大多数 `Loader` 来说，运行在 `HappyPack` 与运行在 `Webpack` 原生环境相比没有太大差异；但 `Thread-loader` 并不具备这一特性，所以要求 `Loader` 内不能调用特定上下文接口，兼容性较差。

```bash
yarn add -D thread-loader
```

放在 `use` 数组首位，确保最先运行

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: "thread-loader",
            options: {
              workers: 2,
              workerParallelJobs: 50,
              // ...
            },
          },
          "babel-loader",
          "eslint-loader",
        ],
      },
    ],
  },
};

```

存在问题：

- 在 `Thread-loader` 中运行的 `Loader` 不能调用 `emitAsset` 等接口，这会导致 `style-loader` 这一类加载器无法正常工作，解决方案是将这类组件放置在 `thread-loader` 之前，如 `['style-loader', 'thread-loader', 'css-loader']`；
- `Loader` 中不能获取 `compilation`、`compiler` 等实例对象，也无法获取 `Webpack` 配置

## Parallel-Webpack

```bash
yarn add -D parallel-webpack
```

```js
const createVariants = require('parallel-webpack').createVariants
const webpack = require('webpack')

const baseOptions = {
  entry: './index.js'
}

// 配置变量组合
// 属性名为 webpack 配置属性；属性值为可选的变量
// 下述变量组合将最终产生 2*2*4 = 16 种形态的配置对象
const variants = {
  minified: [true, false],
  debug: [true, false],
  target: ['commonjs2', 'var', 'umd', 'amd']
}

function createConfig (options) {
  const plugins = [
    new webpack.DefinePlugin({
      DEBUG: JSON.stringify(JSON.parse(options.debug))
    })
  ]
  return {
    output: {
      path: './dist/',
      filename: 'MyLib.' +
                options.target +
                (options.minified ? '.min' : '') +
                (options.debug ? '.debug' : '') +
                '.js'
    },
    plugins: plugins
  }
}

module.exports = createVariants(baseOptions, variants, createConfig)
```

执行 `npx parallel-webpack` 命令生成多份产物文件。

缺点：

对单 `entry` 的项目没有任何收益，只会徒增进程创建成本；但特别适合 MPA 等多 `entry` 场景，或者需要同时编译出 `esm`、`umd`、`amd` 等多种产物形态的类库场景。

## 并行压缩

Webpack4 默认使用 [Uglify-js](https://www.npmjs.com/package/uglifyjs-webpack-plugin) 实现代码压缩，Webpack5 之后则升级为 [Terser](https://webpack.js.org/plugins/terser-webpack-plugin/) 

```js
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            parallel: 2 // number | boolean
        })],
    },
};
```

## 总结

- 对于 Webpack4 之前的项目，可以使用 `HappyPack` 实现并行文件加载；
- Webpack4 之后则建议使用 `Thread-loader`；
- 多实例并行构建场景建议使用 `Parallel-Webpack` 实现并行；
- 生产环境下还可配合 `terser-webpack-plugin` 的并行压缩功能，提升整体效率。
