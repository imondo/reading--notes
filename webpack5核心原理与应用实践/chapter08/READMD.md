# 构建微前端应用

`Module Federation` 通常译作“模块联邦”，是 Webpack 5 新引入的一种远程模块动态加载、运行技术。MF 允许我们将原本单个巨大应用按我们理想的方式拆分成多个体积更小、职责更内聚的小应用形式，理想情况下各个应用能够实现独立部署、独立开发(不同应用甚至允许使用不同技术栈)、团队自治，从而降低系统与团队协作的复杂度 —— 没错，这正是所谓的微前端架构。

- 应用可按需导出若干模块，这些模块最终会被单独打成模块包，功能上有点像 NPM 模块；
- 应用可在运行时基于 HTTP(S) 协议动态加载其它应用暴露的模块，且用法与动态加载普通 NPM 模块一样简单；
- 与其它微前端方案不同，MF 的应用之间关系平等，没有主应用/子应用之分，每个应用都能导出/导入任意模块；

## 简单示例

`Module Federation` 的基本逻辑是一端导出模块，另一端导入、使用模块，实现上两端都依赖于 Webpack 5 内置的 `ModuleFederationPlugin` 插件：

- 对于模块生成方，需要使用 `ModuleFederationPlugin` 插件的 `expose` 参数声明需要导出的模块列表；
- 对于模块使用方，需要使用 `ModuleFederationPlugin` 插件的 `remotes` 参数声明需要从哪些地方导入远程模块。

[示例](https://github1s.com/Tecvan-fe/webpack-book-samples/blob/HEAD/MF-basic/package.json)

```md
MF-basic
├─ app-1
│  ├─ dist
│  │  ├─ ...
│  ├─ package.json
│  ├─ src
│  │  ├─ main.js
│  │  ├─ foo.js
│  │  └─ utils.js
│  └─ webpack.config.js
├─ app-2
│  ├─ dist
│  │  ├─ ...
│  ├─ package.json
│  ├─ src
│  │  ├─ bootstrap.js
│  │  └─ main.js
│  ├─ webpack.config.js
├─ lerna.json
└─ package.json
```

app-1 负责导出模块 —— 类似于子应用；app-2 负责使用这些模块 —— 类似于主应用

子应用

```js
const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  mode: "development",
  devtool: false,
  entry: path.resolve(__dirname, "./src/main.js"),
  output: {
    path: path.resolve(__dirname, "./dist"),
    // 必须指定产物的完整路径，否则使用方无法正确加载产物资源
    publicPath: `http://localhost:8081/dist/`,
  },
  plugins: [
    new ModuleFederationPlugin({
      // MF 应用名称
      name: "app1",
      // MF 模块入口，可以理解为该应用的资源清单
      filename: `remoteEntry.js`,
      // 定义应用导出哪些模块
      exposes: {
        "./utils": "./src/utils",
        "./foo": "./src/foo",
      },
    }),
  ],
  // MF 应用资源提供方必须以 http(s) 形式提供服务
  // 所以这里需要使用 devServer 提供 http(s) server 能力
  devServer: {
    port: 8081,
    hot: true,
  },
};

```

模块导出方

- 需要使用 `ModuleFederationPlugin` 的 `exposes` 项声明哪些模块需要被导出, 使用 `filename` 项声明导出模块的名称

- 使用 `devServer` 启动一个 http(s) server, 以便其他应用可以访问到这些模块

使用 `ModuleFederationPlugin` 插件后，Webpack 会将 `exposes` 声明的模块分别编译为独立产物，并将产物清单、MF 运行时等代码打包进 `filename` 定义的应用入口文件(Remote Entry File)中。例如 app-1 经过 Webpack 编译后，将生成如下产物：

```md
MF-basic
├─ app-1
│  ├─ dist
│  │  ├─ main.js
│  │  ├─ remoteEntry.js
│  │  ├─ src_foo_js.js
│  │  └─ src_utils_js.js
│  ├─ src
│  │  ├─ ...
```

- `main.js` 为整个应用的编译结果，此处可忽略；
- `src_utils_js.js` 与 `src_foo_js.js` 分别为 `exposes` 声明的模块的编译产物；
- `remoteEntry.js` 是 `ModuleFederationPlugin` 插件生成的应用入口文件，包含模块清单、MF 运行时代码。

主应用

```js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  mode: "development",
  devtool: false,
  entry: path.resolve(__dirname, "./src/main.js"),
  output: {
    path: path.resolve(__dirname, "./dist"),
  },
  plugins: [
    // 模块使用方也依然使用 ModuleFederationPlugin 插件搭建 MF 环境
    new ModuleFederationPlugin({
      // 使用 remotes 属性声明远程模块列表
      remotes: {
        // 地址需要指向导出方生成的应用入口文件
        RemoteApp: "app1@http://localhost:8081/dist/remoteEntry.js",
      },
    }),
    new HtmlWebpackPlugin(),
  ],
  devServer: {
    port: 8082,
    hot: true,
    open: true,
  },
};

```
作用远程模块使用方，`app-2` 需要使用 `ModuleFederationPlugin` 声明远程模块的 HTTP(S) 地址与模块名称(示例中的 `RemoteApp`)，之后在 app-2 中就可以使用模块名称异步导入 `app-1` 暴露出来的模块，例如：

```js
// app-2/src/main.js
(async () => {
  const { sayHello } = await import("RemoteApp/utils");
  sayHello();
})();

```

- `remoteEntry.js` 即 app-1 构建的应用入口文件；
- `src_utils_js.js` 则是 `import("RemoteApp/utils")` 语句导入的远程模块。

导出方需要使用插件的 `exposes` 项声明导出哪些模块，使用 `filename` 指定生成的入口文件；导入方需要使用 `remotes` 声明远程模块地址，之后在代码中使用异步导入语法 `import("module")` 引入模块。

## 依赖共享

分开打包的方式势必会出现依赖被重复打包，造成产物冗余的问题，为此 `ModuleFederationPlugin` 提供了 `shared` 配置用于声明该应用可被共享的依赖模块。

导出方

```js
module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: "app1",
      filename: `remoteEntry.js`,
      exposes: {
        "./utils": "./src/utils",
        "./foo": "./src/foo",
      }, 
      // 可被共享的依赖模块
      shared: ['lodash']
    }),
  ],
  // ...
};

```

导入方

```js
module.exports = {
  // ...
  plugins: [
    // 模块使用方也依然使用 ModuleFederationPlugin 插件搭建 MF 环境
    new ModuleFederationPlugin({
      // 使用 remotes 属性声明远程模块列表
      remotes: {
        // 地址需要指向导出方生成的应用入口文件
        RemoteApp: "app1@http://localhost:8081/dist/remoteEntry.js",
      },
      shared: ['lodash']
    }),
    new HtmlWebpackPlugin(),
  ],
  // ...
};
```
这里要求两个应用使用 版本号完全相同 的依赖才能被复用，假设上例应用 app-1 用了 `lodash@4.17.0` ，而 app-2 用的是 `lodash@4.17.1`，Webpack 还是会同时加载两份 `lodash` 代码，我们可以通过 `shared.[lib].requiredVersion` 配置项显式声明应用需要的依赖库版本来解决这个问题：

```js
module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      // ...
      // 共享依赖及版本要求声明
      shared: {
        lodash: {
          requiredVersion: "^4.17.0",
        },
      },
    }),
  ],
};

```

上例 `requiredVersion: "^4.17.0"` 表示该应用支持共享版本大于等于 `4.17.0` 小于等于 `4.18.0` 的 `lodash`，其它应用所使用的 `lodash` 版本号只要在这一范围内即可复用。`requiredVersion` 支持 `Semantic Versioning 2.0` 标准，这意味着我们可以复用 `package.json` 中声明版本依赖的方法。

`requiredVersion` 的作用在于限制依赖版本的上下限，实用性极高。除此之外，我们还可以通过 `shared.[lib].shareScope` 属性更精细地控制依赖的共享范围，例如：

```js
module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      // ...
      // 共享依赖及版本要求声明
      shared: {
        lodash: {
            // 任意字符串
            shareScope: 'foo'
        },
        },
      }),
  ],
  // ...
};
```

在这种配置下，其它应用所共享的 `lodash` 库必须同样声明为 `foo` 空间才能复用。`shareScope` 在多团队协作时能够切分出多个资源共享空间，降低依赖冲突的概率。

除 `requiredVersion/shareScope` 外，`shared` 还提供了一些不太常用的[配置](https://webpack.js.org/plugins/module-federation-plugin/)：

- singletong：强制约束多个版本之间共用同一个依赖包，如果依赖包不满足版本 `requiredVersion` 版本要求则报警告

- version：声明依赖包版本，缺省默认会从包体的 package.json 的 version 字段解析

- packageName：用于从描述文件中确定所需版本的包名称，仅当无法从请求中自动确定包名称时才需要这样做

- eager：允许 webpack 直接打包该依赖库 —— 而不是通过异步请求获取库

- import：声明如何导入该模块，默认为 shared 属性名，实用性不高

## 微前端

示例[MF-micro-fe](https://github1s.com/Tecvan-fe/webpack-book-samples/blob/HEAD/MF-micro-fe/package.json)

```md
MF-micro-fe
├─ packages
│  ├─ host
│  │  ├─ public
│  │  │  └─ index.html
│  │  ├─ src
│  │  │  ├─ App.js
│  │  │  ├─ HomePage.js
│  │  │  ├─ Navigation.js
│  │  │  ├─ bootstrap.js
│  │  │  ├─ index.js
│  │  │  └─ routes.js
│  │  ├─ package.json
│  │  └─ webpack.config.js
│  └─ order
│     ├─ src
│     │  ├─ OrderDetail.js
│     │  ├─ OrderList.js
│     │  ├─ main.js
│     │  └─ routes.js
│     ├─ package.json
│     └─ webpack.config.js
├─ lerna.json
└─ package.json
```

order MF 配置

```js
module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: "order",
      filename: "remoteEntry.js",
      // 导入路由配置
      exposes: {
        "./routes": "./src/routes",
      },
    }),
  ],
};

```
注意，order 应用实际导出的是路由配置文件 routes.js。而 host 则通过 MF 插件导入并消费 order 应用的组件，对应配置

```js
module.exports = {
  // ...
  plugins: [
    // 模块使用方也依然使用 ModuleFederationPlugin 插件搭建 MF 环境
    new ModuleFederationPlugin({
      // 使用 remotes 属性声明远程模块列表
      remotes: {
        // 地址需要指向导出方生成的应用入口文件
        RemoteOrder: "order@http://localhost:8081/dist/remoteEntry.js",
      },
    })
  ],
  // ...
};
```
在 host 应用中引入 order 的路由配置并应用到页面中

```js
import localRoutes from "./routes";
// 引入远程 order 模块
import orderRoutes from "RemoteOrder/routes";

const routes = [...localRoutes, ...orderRoutes];

const App = () => (
  <React.StrictMode>
    <HashRouter>
      <h1>Micro Frontend Example</h1>
      <Navigation />
      <Routes>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <React.Suspense fallback={<>...</>}>
                <route.component />
              </React.Suspense>
            }
            exact={route.exact}
          />
        ))}
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

export default App;
```

通过这种方式，一是可以将业务代码分解为更细粒度的应用形态；二是应用可以各自管理路由逻辑，降低应用间耦合性。最终能降低系统组件间耦合度，更有利于多团队协作。

参考：

- [Webpack 5 之 模块联合 (Module Federation)](https://www.lumin.tech/articles/webpack-module-federation/)

- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)