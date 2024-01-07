# 构建现代 JS 工程环境

## 使用 Babel

将高版本代码等价转译成低版本代码，向后兼容

使用 babel-loader 接入转译功能，安装依赖

```bash
npm i -D @babel/core @babel/preset-env babel-loader
```

添加规则

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader']
            }
        ]
    }
}
```

配置 Babel 逻辑

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
}
```

`@babel/preset-env` 是 Babel 预设规则集 ---- Preset，这种设计能按需将一系列复杂、数量庞大的配置、插件、Polyfill 等打包成一个单一的资源包，从而简化 Babel 的应用、学习成本。Preset 是 Babel 的主要应用方式之一，社区已经针对不同应用场景打包了各种 `Preset` 资源，例如：

- `babel-preset-react`：包含 React 常用插件的规则集，支持 `preset-flow`、`syntax-jsx`、`transform-react-jsx` 等；
- `@babel/preset-typescript`：用于转译 TypeScript 代码的规则集
- `@babel/preset-flow`：用于转译 Flow 代码的规则集

## TypeScript

使用 `ts-loader` 接入 TypeScript

```bash
npm i -D typescript ts-loader
```

配置规则

```js
const path = require('path')

module.exports = {
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
}
```

使用 `resolve.extensions` 声明自动解析 `.ts` 后缀文件，这意味着代码如 `import "./a.ts"` 可以忽略后缀声明，简化为 `import "./a"` 文件

创建 tsconfig.json 配置文件

```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "moduleResolution": "node"
  }
}

```

### 综合示例

```bash
npm i -D webpack webpack-cli \
    # babel 依赖
    @babel/core @babel/cli @babel/preset-env babel-loader \
    # TypeScript 依赖
    typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin \
    @babel/preset-typescript \
    # ESLint 依赖
    eslint eslint-webpack-plugin

```

配置文件

```js
const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  devtool: false,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-typescript'] }
        }
      }
    ]
  },
  plugins: [new ESLintPlugin({ extensions: ['.js', '.ts'] })]
}

```

创建 `.eslintrc` 文件

```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["plugin:@typescript-eslint/recommended"]
}
```



