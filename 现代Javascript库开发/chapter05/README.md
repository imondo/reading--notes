# 维护

## 社区协作

多人协作和维护

### 社区反馈

`Issue` 反馈信息分类

- 求助类：`help wanted`

- 故障类：`bug`

- 建议类：`enhancement`

规范 `Issue` 录入内容

根目录添加 `.github/ISSUE_TEMPLATE.md` 文件

```markdown
### 问题是什么

问题的具体描述

### 环境

- 手机：小米

- 系统：安卓

- 浏览器：Chrome

- 其他

### 在线例子

如果有，则请提供在线例子

### 其他

其他信息
```

新建 `Issue` 时，会默认展示 `ISSUE_TEMPLATE.md` 中的内容，如果没有这个文件，则默认填充为空。

提交的故障类 `Issue`，修复 `Bug`，提交代码，发布新版本。在提交代码时，提交信息添加 `Issue ID`，即可关联。

```bash
git commit -m "fixed: 修复 Bug #3"
```

在提交信息中添加 `fix`、`fixed`、`close`、`closed` 等关键词自动关闭 `Issue`。

```bash
git commit -m "fixed: 修复 Bug closed #3"
```

`Pull request` 反馈内容是源代码。它和 `Issue ID` 是打通的，可以相互关联，关联方式在评论框输入 `#` 符号即可。

`Discussions` 方便社区用户交流，进行讨论，包括计划、草案、希望的新特性。

### 社区协作

群体智慧大于个体智慧。

3种共建模式：

- Fork + Pull request 

- 库开发者模式（Collaborators）

- 组织模式（Organization）

### 社区运营

捐赠是社区对库的开发者最好的评价。

`Edit funding links` 设置打赏途径。也可以直接添加 `.github/FUNDING.yml`

```yml
# there are supported funding model platforms

custom: ['https://test.com/mywallet/']
```

设置后，仓库会显示 `Sponsor` 按钮。

荣誉感是社区贡献者最好的奖励。对核心贡献者，库的开发者可以在首页给出特别感谢。

## 规范先行

多人协作项目里，统一的规范对保证开发效率和代码质量至关重要。

### 编辑器

`EditorConfig` 可以在不同平台的不同编辑器之间维护一致的公共配置。

根目录和子目录可以同时存在 `.editorconfig` 文件，子目录优先级更高，位于根目录中文件需要将 `root` 设置 `true`。

```conf
# 根目录

root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true

# set default chartset
[*.{js}]
chartset = utf-8
```

`EditorConfig` 配置项

|  配置项   | 说明  | 建议  |
|  ----  | ----  | ----  |
| charset | 指定字符集 | 建议配置 |
| end_of_line | 指定换行符，可选 lf、cr、crlf | 建议配置 |
| indent_style | 缩进风格为空格，可选 space、tab | 建议配置 |
| indent_size | 缩进的空格数设置为 2 个 |  建议配置|
| trim_trailing_whitespace | 去掉行尾空格 | 可选配置 |
| insert_final_newline | 文件结尾插入新行 | 可选配置 |

对库添加 EditorConfig 支持

```conf
# 根目录
root = true

[*]
charset = utf-8
end_of_lines = lf
insert_final_newline = true

[*.{html}]
indent_style = space
indent_size = 2

[*.{js}]
indent_style = space
indent_size = 2

[*.{yml}]
indent_style = space
indent_size = 2

[*.{md}]
indent_style = space
indent_size = 4
```

有些编辑器默认支持 `EditorConfig`，如 `WebStorm`；有些需要安装插件，如 `VS Code` 和 `Sublime Text`。

插件 `EditorConfig for VS Code`。

### 格式化

良好的代码风格可以让代码结构清晰，容易阅读。风格不一致，合并代码时会带来很多麻烦。

`Prettier` 代码格式化工具

```bash
npm i prettier --save-dev --save-exact
```

- 忽略格式化 `.prettierignore`

```conf
# .prettierignore

dist
coverage
.nyc_output
package-lock.json
```

配置项

|  配置项   | 说明  | 默认值  |
|  ----  | ----  | ----  |
| tabWidth | 缩进的宽度 | 默认2 |
| useTabs | 缩进使用 Tab 健 | 默认空格 |
| singleQuote | 使用单引号 | 默认使用双引号 |
| bracketSpacing | 括号两侧插入空格 |  默认插入|
| endOfLine | 换行符 | 默认 if |
| trailingComma | 多行结构，尾部添加逗号 | es5 |

- 自定义配置，项目根目录添加 `.prettierrc`

```json
{
    "eslintIntegration": true,
    "stylelintIntegration": true,
    "tabWidth": 4,
    "singleQuote": true,
    "semi": true,
    "htmlWhitespaceSensitivity": "ignore"
}
```

- `Git` 提交前自动格式化方案：`husky`

husky 有两种安装方式

- 自动

```bash
npx husky-init
```

- 手动

```bash
# 安装依赖
npm i husky -D

# 初始化配置
npx husky install

# 设置 prepare
npm set-script prepare "husky install"
```

安装完成后，添加命令 `package.json` 

```json
{
    "scripts": {
        "prepare": "husky install"
    }
}
```
安装依赖 `pretty-quick`

```bash
npm i pretty-quick -D
```

修改 `.husky/pre-commit` 文件

```bash
#!/bin/sh
. "${dirname "$0"}/_/husky.sh"

npx pretty-quick --staged
```

尝试修改代码，提交代码，可看到自动格式化效果。

### 代码 Lint

`ESLint` 校验

```bash
npm i eslint -D
```

初始化配置

```bash
npx eslint --init
You can also run this command directly using 'npm init @eslint/config'.
Need to install the following packages:
  @eslint/create-config
Ok to proceed? (y) y
✔ How would you like to use ESLint? · problems
✔ What type of modules does your project use? · esm
✔ Which framework does your project use? · none
✔ Does your project use TypeScript? · No / Yes
✔ Where does your code run? · browser
✔ What format do you want your config file to be in? · JavaScript
A config file was generated, but the config file itself may not follow your linting rules.
```

配置初始化后，自动生成 `.eslintrc.js` 文件

```js
module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
    },
    "extends": "eslint:recommended",
    "overrides": [
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
    }
}
```

- `parserOptions`：支持的 ES 语法

- `env`：配置环境预置的全局变量，"browser.true" 支持浏览器环境全局配置，`false` 则会报错

rules 校验默认关闭，开启则需要在 rules 中配置；每个校验规则有 3 个报错等级。

- 0 代表关闭

- 1 代表警告

- 2 代表错误

```js
module.exports = {
    rules: {
        quotes: 1,
        eqeqeq: 2
    }
}
```

成熟的社区规则集

```js
module.exports = {
    extends: ['eslint:recommended']
}
```

`ESLint` 支持目录校验，修改命令，只校验指定文件即可。

```bash
npx eslint src test config
```

支持忽略文件 `.eslintignore`，默认忽略 `node_modules` 目录下所有文件

```bash
# eslintignore

dist
```

在 `package.json` 上添加命令

```json
{
    "scripts": {
        "lint": "eslint src config test"
    }
}
```

校验规则可以分为两类：

- 校验风格

- 校验质量

代码风格可能会与 `Prettier` 规则冲突，解决冲突的插件 `eslint-plugin-prettier` 和 `eslint-config-prettier`

`eslint-plugin-prettier` 先检查是否符合 `Prettier` 规则，不符合，先进行格式化，后对比是否一致，不一致报错。

```bash
npm i eslint-plugin-prettier -D
```

修改 `.eslintrc.js`

```js
module.exports = {
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'error'
    }
}
```

`eslint-config-prettier` 是规则集，其作用是把 `ESlint` 和 `Prettier` 的规则冲突都关闭。

```bash
npm i eslint-config-prettier -D
```

修改 `.eslintrc.js`

```js
module.exports = {
    plugins: ['prettier'],
    extends: ['eslint:recommended', 'prettier'],
    rules: {
        'prettier/prettier': 'error'
    }
}

// 或者
module.exports = {
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
}
```

只对提交的代码进行校验

```bash
npm i lint-staged -D
```

根目录下新建 `.lintstagedrc.js`

```js
module.exports = {
    '**/*.js': ['eslint --cache']
}
```

修改 `./.husky/pre-commit` 文件，添加 `lint-staged` 校验命令

```bash
#!/bin/sh
. "${dirname "$0"}/_/husky.sh"

npx pretty-quick --staged
npx lint-staged
```

### 提交信息

统一提交信息格式

- 约束作用，避免毫无意义的提交信息

- 规范的提交信息，检索更方便

- 当生成变更日志时，可以直接从提交信息中提取

推荐提交信息的结构格式

```bash
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

示例：

```bash
feat: 添加 ESlint 校验

1. 添加 ESLint
2. 支持...
3. xxx
```

更多语义的 `type`：

- feat: 开发新的功能

- fix: 修复Bug

- docs: 修改文档

- style: 修改样式

- refactor: 重构代码逻辑，不修改功能

- test: 修改测试代码

校验提交信息，使用插件

```bash
npm i @commitlint/config-conventional @commitlint/cli -D
```

根目录新建 `commitlint.config.js`

```js
module.exports = {
    extends: ['@commitlint/config-conventional']
}
```

优化提交信息时交互式录入命令

```bash
npm i @commitlint/prompt-cli -D
```

`package.json` 添加命令

```json
{
    "scripts": {
        "ci": "git commit"
    }
}
```

`commitizen` 专注于交互式录入提交信息的工具

```bash
npm i @commitlint/cz-commitlint commitizen -D
```

修改 `package.json` 添加 `commitizen` 字段

```json
{
    "scripts": {
        "cz": "git-cz"
    },
    "config": {
        "commitizen": {
            "path": "@commitlint/cz-commitlint"
        }
    }
}
```

每次提交都需要记录变更日志，使用 `Standard Version` 工具自动生成变更日志

```bash
npm i standard-version -D
```

执行命令

```bash
git log --oneline

3f5817a feat: 现代Javascript库开发第二章
e1e4ea9 feat: 现代Javascript库开发
```

执行 `standard-version` 命令

```bash
npx standard-version --dry-run
```

添加 `--dry-run` 

不加 `--dry-run`，会进行如下操作

1. 修改版本号

- 修改 `package.json`

- 会根据 `type` 来决定升级哪个版本号

- 因为有 `feat`，所以将版本从 1.0.0 升级到 1.1.0

2. 修改 `CHANGELOG.md`：只包含符合提交规范的提交信息

3. 提交内容

4. 添加 `Git Tag`

## 持续集成