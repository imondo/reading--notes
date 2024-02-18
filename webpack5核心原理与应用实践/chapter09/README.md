# 构建开发 PWA、Node、Electron 应用

## 构建 PWA

PWA 全称 Progressive Web Apps (渐进式 Web 应用)；一系列将网页如同独立 APP 般安装到本地的技术集合，借此，我们即可以保留普通网页轻量级、可链接(SEO 友好)、低门槛（只要有浏览器就能访问）等优秀特点，又同时具备独立 APP 离线运行、可安装等优势。

- Service Worker

一种介于网页与服务器之间的本地代理，主要实现 PWA 应用的离线运行功能。例如 [ServiceWorker](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API) 可以将页面静态资源缓存到本地，用户再次运行页面访问这些资源时，ServiceWorker 可拦截这些请求并直接返回缓存副本，即使此时用户处于离线状态也能正常使用页面

- manifest.json 

一个配置文件，用于指定应用的名称、图标、启动界面、权限等，是 PWA 应用的元数据文件。

```json
// manifest.json
{
  "icons": [
    {
      "src": "/icon_120x120.0ce9b3dd087d6df6e196cacebf79eccf.png",
      "sizes": "120x120",
      "type": "image/png"
    }
  ],
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "display": "standalone",
  "start_url": ".",
  "description": "My awesome Progressive Web App!"
}
```

我们可以选择自行开发、维护 `ServiceWorker` 及 `manifest` 文件 ，也可以简单点使用 Google 开源的 `Workbox` 套件自动生成 PWA 应用的壳，首先安装依赖：

```bash
yarn add -D workbox-webpack-plugin webpack-pwa-manifest
```

- `workbox-webpack-plugin`：用于自动生成 `ServiceWorker` 代码的 `Webpack` 插件；

- `webpack-pwa-mainifest`：根据 `Webpack` 编译结果，自动生成 `PWA Manifest` 文件的 `Webpack` 插件。

修改配置

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin({
      title: "Progressive Web Application",
    }),
    // 自动生成 Manifest 文件
    new WebpackPwaManifest({
      name: "My Progressive Web App",
      short_name: "MyPWA",
      description: "My awesome Progressive Web App!",
      publicPath: "/",
      icons: [
        {
          // 桌面图标，注意这里只支持 PNG、JPG、BMP 格式
          src: path.resolve("src/assets/logo.png"),
          sizes: [150],
        },
      ],
    }),
    // 自动生成 ServiceWorker 文件
    new GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
};
```

参考：

- https://developer.chrome.com/docs/workbox/service-worker-overview?hl=zh-cn

- https://developer.chrome.com/docs/workbox/modules/workbox-webpack-plugin?hl=zh-cn

## 构建 Node 应用

在开发 `Node` 程序时使用 `Webpack` 的必要性并不大

- `Webpack` 的 `target` 值设置为 `node` ，这能让 `Webpack` 忽略 `fs/path` 等原生 `Node` 模块；

- 需要使用 `externals` 属性过滤 `node_modules` 模块，简单起见，也可以直接使用 `webpack-node-externals` 库；

- 需要使用 `node` 属性，正确处理 `__dirname`、`__filename` 值

```js
const nodeExternals = require("webpack-node-externals");

module.exports = merge(WebpackBaseConfig, {
  // 1. 设置 target 为 node
  target: "node",
  entry: ...,
  module: [...],
  // 2. 过滤 node_modules 模块
  externals: [nodeExternals()],
  // 3. 设置 __dirname, __filename 值
  node: {
    __filename: false,
    __dirname: false,
  },
});

```

需要特别注意，在 `Node` 代码中请务必慎用动态 `require` 语句，你很可能会得到预期之外的效果！例如对于下面的示例目录：

```md
├─ example
│  ├─ src
│  │  ├─ foo.js
│  │  ├─ bar.js
│  │  ├─ unused.js
│  │  └─ main.js
│  ├─ package.json
│  └─ webpack.config.js
```

其中 `main.js`

```js
const modules = ['foo', 'bar'].map(r => require(`./${r}.js`));
```

`Webpack` 遇到示例中的 `require` 语句时，仅仅依靠词法规则、静态语义、AST 等手段并不能推断出实际依赖情况，只能退而求其次粗暴地将所有可能用到的代码一股脑合并进来，这种处理手段很可能会带来许多意想不到的结果，很可能触发 BUG！

综上，建议尽量不要使用 Webpack 构建 Node 应用。

## 构建 Electron 应用

Electron 是一种使用 JavaScript、HTML、CSS 等技术构建跨平台桌面应用开发框架；由一个 **主进程** 及若干 **渲染进程** 组成，进程之间以 IPC 方式通讯。

- 主进程是一个 Node 程序，能够使用所有 Node 能力及 Electron 提供的 Native API，主要负责应用窗口的创建与销毁、事件注册分发、版本更新等；

- 渲染进程本质上是一个 Chromium 实例，负责加载我们编写的页面代码，渲染成 Electron 应用界面。

Electron 这种多进程机构，要求我们能在同一个项目中同时支持主进程与若干渲染进程的构建，两者打包需求各有侧重。

> 示例[代码](https://github1s.com/Tecvan-fe/webpack-book-samples/tree/main/8-3_electron-wp)

```md
├─ package.json
├─ webpack.main.config.js       // 主进程构建配置
├─ webpack.renderer.config.js   // 渲染进程构建配置
├─ src
│  ├─ main.js
│  ├─ pages
│  │  ├─ home
│  │     ├─ index.js
│  │  ├─ login
│  │     ├─ index.js
```

- `src/main.js` 为主进程代码

- `src/pages/${page name}/` 目录为渲染进程 —— 即桌面应用中每一个独立页面的代码

- 由于主进程、渲染进程的打包差异较大，这里为方便演示，直接写成两个配置文件：`webpack.main.config.js` 与 `webpack.renderer.config.js`

### 主进程

```js
// src/main.js
const { app, BrowserWindow } = require("electron");

// 应用启动后
app.whenReady().then(() => {
  // 创建渲染进程实例
  const win = new BrowserWindow({
    width: 800,
    height: 600
  });
  // 使用 BrowserWindow 实例打开页面
  win.loadFile("home.html");
});

```

代码核心逻辑是在应用启动后 （`app.whenReady` 钩子），创建 `BrowserWindow` 实例并打开页面。

> 完整[示例](https://www.electronjs.org/zh/docs/latest/tutorial/examples)

Electron 主进程本质上是一个 `Node` 程序，因此许多适用于 `Node` 的构建工具、方法也同样适用主进程，例如 `Babel`、`TypeScript`、`ESLint` 等。与普通 `Node` 工程相比，构建主进程时需要注意：

- 需要将 `target` 设置为 `electron-main` ，`Webpack` 会自动帮我们过滤掉一些 `Electron` 组件，如 `clipboard`、`ipc`、`screen` 等

- 需要使用 `externals` 属性排除 `node_modules` 模块，简单起见也可以直接使用 `webpack-node-externals` 包

- 生产环境建议将 `devtools` 设置为 `false`，减少包体积

配置

```js
// webpack.main.config.js
const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  // 主进程需要将 `target` 设置为 `electron-main`
  target: "electron-main",
  mode: process.env.NODE_ENV || "development",
  // 开发环境使用 `source-map`，保持高保真源码映射，方便调试
  devtool: process.env.NODE_ENV === "production"? false: "source-map",
  entry: {
    main: path.join(__dirname, "./src/main"),
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "./dist"),
  },
  externals: [nodeExternals()],
};
```

执行构建命令

```bash
npx webpack -c webpack.main.config.js
```

> 安装 Electron 过程中可能会遇到网络超时问题，这是因为资源域已经被墙了，可以使用阿里云镜像解决

```bash
ELECTRON_MIRROR="https://cdn.npm.taobao.org/dist/electron/" npm i -D electron
```

### 渲染进程打包配置

和 `web` 构建配置差异：

- 需要将 `Webpack` 的 `target` 配置设置为 `electron-renderer`；
- `Electron` 应用通常包含多个渲染进程，因此我们经常需要开启多页面构建配置；
- 为实现渲染进程的 `HMR` 功能，需要对主进程代码稍作改造。

> Webpack 为 Electron 提供了三种特殊 target 值：electron-main/electron-renderer/electron-preload，分别用于主进程、Renderer 进程、Preload 脚本三种场景。

```js
// webpack.renderer.config.js
// 入口文件列表
const entries = {
  home: path.join(__dirname, "./src/pages/home"),
  login: path.join(__dirname, "./src/pages/login"),
};

// 为每一个入口创建 HTMLWebpackPlugin 实例
const htmlPlugins = Object.keys(entries).map(
  (k) =>
    new HtmlWebpackPlugin({
      title: `[${k}] My Awesome Electron App`,
      filename: `${k}.html`,
      chunks: [k],
    })
);

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: entries,
  // 渲染进程需要将 `target` 设置为 `electron-renderer`
  target: "electron-renderer",
  plugins: [...htmlPlugins],
  // ...
};

```

由于 `Webpack` 的 `HMR` 功能强依赖于 `WebSocket` 实现通讯，但 `Electron` 主进程常用文件协议 `file://` 打开页面，该协议不支持 `WebSocket` 接口，为此我们需要改造主进程启动代码，以 `HTTP` 方式打开页面代码

```js
function createWindow() {
  const win = new BrowserWindow({
    //...
  });

  if (process.env.NODE_ENV === "development") {
    // 开发环境下，加载 http 协议的页面，方便启动 HMR
    win.loadURL("http://localhost:8080/home");
  } else {
    // 生产环境下，依然使用 `file://` 协议
    win.loadFile(path.join(app.getAppPath(), "home.html"));
  }
}
```

> 在生产环境中，出于性能考虑，Electron 主进程通常会以 [File URL Scheme](https://en.wikipedia.org/wiki/File_URI_scheme) 方式直接加载本地 HTML 文件，这样我们就不必为了提供 HTML 内容而专门启动一个 HTTP 服务进程。不过，同一份代码，用 File URL Scheme 和用 HTTP 方式打开，浏览器提供的接口差异较大，开发时注意区分测试接口兼容性。