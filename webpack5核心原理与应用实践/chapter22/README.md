# 如何提升插件的健壮性

## 日志处理

- 通过 `compilation.getLogger` 获取分级日志管理器
- 使用 `compilation.errors/wraning` 处理异常信息

```js
const PLUGIN_NAME = "FooPlugin";

class FooPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      // 获取日志对象
      const logger = compilation.getLogger(PLUGIN_NAME);
      // 调用分级日志接口
      logger.log('Logging from FooPlugin')
      logger.error("Error from FooPlugin");
    });
  }
}

module.exports = FooPlugin;
```

> 正确处理异常信息

- 使用 `logger.error/warning` 接口，这种方法同样不会中断构建流程，且能够复用 Webpack 的分级日志体系，由最终用户决定是否输出对应等级日志
- 借助 `compilation.errors/warnings` 数组

```js
const PLUGIN_NAME = "FooPlugin";

class FooPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.errors.push(new Error("Emit Error From FooPlugin"));
      compilation.warnings.push("Emit Warning From FooPlugin");
    });
  }
}

module.exports = FooPlugin;
```

- 使用 `Hook Callback`，这种方式可将错误信息传递到 Hook 下一个流程，由 Hook 触发者根据错误内容决定后续处理措施(中断、忽略、记录日志等)，如 `imagemin-webpack-plugin` 中

```js
export default class ImageminPlugin {
  apply (compiler) {
    const onEmit = async (compilation, callback) => {
      try {
        await Promise.all([
          ...this.optimizeWebpackImages(throttle, compilation),
          ...this.optimizeExternalImages(throttle)
        ])

        callback()
      } catch (err) {
        // if at any point we hit a snag, pass the error on to webpack
        callback(err)
      }
    }
    compiler.hooks.emit.tapAsync(this.constructor.name, onEmit)
  }
}
```

- 直接抛出异常

```js
const PLUGIN_NAME = "FooPlugin";

class FooPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      throw new Error("Throw Error Directly")
    });
  }
}

module.exports = FooPlugin;
```

择优选择

- 多数情况下使用 `compilation.errors/warnings`，柔和地抛出错误信息；
- 特殊场景，需要提前结束构建时，则直接抛出异常；
- 拿捏不准的时候，使用 callback 透传错误信息，交由上游调用者自行判断处理措施

## 上报统计信息


有时候我们需要在插件中执行一些特别耗时的操作，例如：抽取 CSS 代码（如 mini-css-extract-plugin）、压缩图片（如 image-minimizer-webpack-plugin）、代码混淆（如 terser-webpack-plugin），这些操作会延长 Webpack 构建的整体耗时，更糟糕的是会阻塞构建主流程，最终用户会感觉到明显卡顿。

可以在插件中上报一些统计信息，帮助用户理解插件的运行进度与性能情况，有两种上报方式

- 使用 [ProgressPlugin](https://webpack.js.org/plugins/progress-plugin) 插件的 `reportProgress` 接口上报执行进度；
- 使用 [stats](https://webpack.js.org/api/stats/) 接口汇总插件运行的统计数据

> 使用 reportProgress 接口

ProgressPlugin 是 Webpack 内置用于展示构建进度的插件，有两种用法

1. 命令行

```bash
npx webpack --progress
```

2. 配置文件中添加插件实例

```js
const { ProgressPlugin } = require("webpack");

module.exports = {
  //...
  plugins: [
    new ProgressPlugin({
      activeModules: false,
      entries: true,
      handler(percentage, message, ...args) {
        // custom logic
      },
      //...
    }),
  ],
};
```

使用 `ProgressPlugin` 插件的 `Reporter` 方法提交自定义插件的运行进度

```js
const { ProgressPlugin } = require("webpack");
const PLUGIN_NAME = "BlockPlugin";
const wait = (misec) => new Promise((r) => setTimeout(r, misec));
const noop = () => ({});

class BlockPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        PLUGIN_NAME,
        async (assets, callback) => {
          const reportProgress = ProgressPlugin.getReporter(compiler) || noop;
          const len = 100;
          for (let i = 0; i < len; i++) {
            await wait(50);
            reportProgress(i / 100, `Our plugin is working ${i}%`);
          }
          reportProgress(1, "Done work!");
          await wait(1000);
          callback();
        }
      );
    });
  }
}

module.exports = BlockPlugin;

```

> 示例[代码](https://github.com/Tecvan-fe/webpack-book-samples/blob/main/plugin-progress/package.json)

调用 ProgressPlugin.getReporter 方法获取 Reporter 函数，之后再用这个函数提交执行进度

```js
const reportProgress = ProgressPlugin.getReporter(compiler) || noop;
```

> 注意：若最终用户没有使用 ProgressPlugin 插件，则这个函数会返回 Undefined，所以需要增加 || noop 兜底。

`reportProgress` 接受如下参数

```js
reportProgress(percentage, ...args);
```

- `percentage`：当前执行进度百分比，但这个参数实际并不生效，由于 `ProgressPlugin` 底层会根据当前处于那个 Hook 计算一个固定的 `Progress` 百分比值
- `...args`：任意数量字符串参数，这些字符串会被拼接到 Progress 输出的信息

> 通过 stats 添加统计信息

借用 stats 机制，向用户输出插件各种维度的统计信息

```js
const PLUGIN_NAME = "FooPlugin";

class FooPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const statsMap = new Map();
      // buildModule 钩子将在开始处理模块时触发
      compilation.hooks.buildModule.tap(PLUGIN_NAME, (module) => {
        const ident = module.identifier();
        const startTime = Date.now();
        // 模拟复杂耗时操作
        // ...
        // ...
        const endTime = Date.now();
        // 记录处理耗时
        statsMap.set(ident, endTime - startTime);
      });

      compilation.hooks.statsFactory.tap(PLUGIN_NAME, (factory) => {
        factory.hooks.result
          .for("module")
          .tap(PLUGIN_NAME, (module, context) => {
            const { identifier } = module;
            const duration = statsMap.get(identifier);
            // 添加统计信息
            module.fooDuration = duration || 0;
          });
      });
    });
  }
}

module.exports = FooPlugin;
```

再次执行 Webpack 构建命令，将产出如下 stats 统计信息

```json
{
  "hash": "0a17278b49620a86b126",
  "version": "5.73.0",
  // ...
  "modules": [
    {
      "type": "module",
      "identifier": "/Users/tecvan/studio/webpack-book-samples/target-sample/src/index.js",
      "fooDuration": 124,
      /*...*/
    },
    /*...*/
    /*...*/
    /*...*/
  ], 
  "assets": [/*...*/],
  "chunks": [/*...*/],
  "entrypoints": {/*...*/},
  "namedChunkGroups": {/*...*/},
  "errors": [/*...*/],
}
```

## 校验配置参数

使用 [Loader 扩展开发工具](../chapter20/README.md) 中介绍的 schema-utils 校验工具的使用方法

```js
const { validate } = require("schema-utils");
const schema = {
  /*...*/
};

class FooPlugin {
  constructor(options) {
    validate(schema, options);
  }
}
```

## 搭建自动测试环境

1. 如何搭建自动运行 Webpack，并能够读取构建结果的测试环境？
2. 如何分析构建结果，确定插件逻辑符合预期？

安装相应的依赖包

```bash
yarn add -D jest babel-jest @babel/core @babel/preset-env

```

添加 babel 配置

```js
// babel.config.js
module.exports = {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
};

```
添加 jest 配置
```js
// jest.config.js
module.exports = {
  testEnvironment: "node",
};
```

测试示例

```js
import webpack from 'webpack';

webpack(config).run();
```

工具函数[示例](https://github.com/Tecvan-fe/webpack-book-samples/blob/main/plugin-testing/test/helpers/index.js)

```js
import path from "path";
import webpack from "webpack";
import { merge } from "webpack-merge";
import { createFsFromVolume, Volume } from "memfs";

export function runCompile(options) {
  const opt = merge(
    {
      mode: "development",
      devtool: false,
      // Mock 项目入口文件
      entry: path.join(__dirname, "./enter.js"),
      output: { path: path.resolve(__dirname, "../dist") },
    },
    options
  );

  const compiler = webpack(opt);
  // 使用内存文件系统，节省磁盘 IO 开支
  compiler.outputFileSystem = createFsFromVolume(new Volume());

  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }
      return resolve({ stats, compiler });
    });
  });
}
```

> 编写测试用例

Webpack 插件测试的基本逻辑是：在测试框架中运行 Webpack，之后对比分析构建结果、状态等是否符合预期，对比的内容通常有

- 分析 compilation.error/warn 数组是否包含或不包含特定错误、异常信息，通常用于判断 Webpack 是否运行成功

- 分析构建产物，判断是否符合预期

  - image-minimizer-webpack-plugin 单测中会 [判断](https://github.com/webpack-contrib/image-minimizer-webpack-plugin/blob/master/test/ImageminPlugin.test.js) 最终产物图片有没有经过压缩
  - copy-webpack-plugn 单测中会 [判断](https://github1s.com/webpack-contrib/copy-webpack-plugin/blob/HEAD/test/CopyPlugin.test.js) 文件有没有被复制到产物文件
  - mini-css-extract-plugin 单测中会 [判断](https://github1s.com/webpack-contrib/mini-css-extract-plugin/blob/HEAD/test/TestCases.test.js) CSS 文件是否被提取到单独文件中

> [示例](https://github.com/Tecvan-fe/webpack-book-samples/blob/main/plugin-testing/test/helpers/index.js)

```js
import path from "path";
import { promisify } from "util";
import { runCompile } from "./helpers";
import FooPlugin from "../src/FooPlugin";

describe("foo plugin", () => {
  it("should inject foo banner", async () => {
    const {
      stats: { compilation },
      compiler,
    } = await runCompile({
      plugins: [new FooPlugin()],
    });
    const { warnings, errors, assets } = compilation;

    // 判断 warnings、errors 是否报出异常信息
    expect(warnings).toHaveLength(0);
    expect(errors).toHaveLength(0);

    const { path: outputPath } = compilation.options.output;
    // 遍历 assets，判断经过插件处理后，产物内容是否符合预期
    await Promise.all(
      Object.keys(assets).map(async (name) => {
        const pathToEmitted = path.join(outputPath, name);
        const result = await promisify(compiler.outputFileSystem.readFile)(
          pathToEmitted,
          { encoding: "UTF-8" }
        );
        expect(result.startsWith("// Inject By 范文杰")).toBeTruthy();
      })
    );
  });
});
```

## 总结

- 应该尽量复用 Webpack Infrastructure Logging 接口记录插件运行日志；
- 若插件运行耗时较大，应该通过 `reportProgress` 接口上报执行进度，供用户了解运行状态；
- 尽可能使用 `schema-utils` 工具校验插件参数，确保输入参数的合法性；
- 可以借助 Node 测试工具，如 Jest、Karma 等搭建插件自动测试环境，之后在测试框架中运行 Webpack，分析比对构建结果、状态(产物文件、`warning/errors` 数组等)，确定插件是否正常运行