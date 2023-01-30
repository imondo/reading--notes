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

持续集成（Continuous Integration, CI）是一种软件开发实践。

### GitHub Actions

`GitHub` 官方提供的自动化服务。

- 和 `GitHub` 集成更容易

- 支持复用其他人的脚本片段

点击 `Actions` 选项，单击 `New workflow` 按钮。

也可以在根目录添加 `.github/workflow/ci.yml` 文件

```yml
name: Node.js CI
on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

jobs:
    build:
        runs-on: ubuntu-latest
        strategy:
            matrix:
                node-version: [12.x, 14.x, 16.x]
        steps:
            - uses: actions/checkout@v2
            - name: Use Node.js ${{ matrix.node-version }}
              uses: actions/steup-node@v2
              with:
                node-version: ${{ matrix.node-version }}
                cache: 'npm'
            - run: npm ci
            - run: npm run build --if-present
            - run: npm test
```

以上配置会在 Node.js 12、14、16 版本上执行

- 克隆仓库

- 安装 `Node.js` 环境

- 安装 `npm` 依赖

- 执行 `npm run build` 命令

- 执行 `npm test` 命令

GitHub Actions 包含 4 个基础概念

- workflow

- job

- step

- action

一个开源库可能存在 3 个 `workflow` 过程配置

```bash
.github
    - workflow
        - ci.yml # 校验
        - publish.yml # 发包
        - deploy.yml # 部署文档
```

常用的配置字段

```yml
# workflow 名称
name: ci
# 指定触发 workflow 的条件
on:
    push:
        branches: [master] # 限定分支
    pull_request:
        branches: [master]
```

`workflow` 可以包含多个 `job`，多个 `job` 默认是并发执行的。可以使用 `needs` 指定 `job` 之间的依赖关系。

```yml
jobs:
    lint:
        runs-on: ubuntu-lastest # 指定运行环境
    test:
        needs: lint # 依赖关系
        runs-on: ubuntu-latest
        strategx:
            matrix:
                node-version: [12.x, 14.x, 16.x] # 指定多个版本都执行
```

`job` 中具体执行由 `step` 指定，一个 `job` 可以包含多个 `step`。`step` 中运行的命令叫做 `action`。

```yml
steps:
    - name: test # step 名称
    env: # 环境变量
        PROD: 1
    run: echo $PROD
```

### CircleCI

第三方持续集成/持续部署服务。开源项目可以免费使用。

### Travis CI

社区的第三方工具，已经不免费了。

## 分支模型

良好的分支管理可以避免很多不必要的麻烦。

### 主分支

主分支是开源项目稳定版本，应包含稳定，没有 Bug 的代码，并保持随时可以发布的状态。

理论上，主分支只包含合并提交，所有迭代应该都在分支上进行。不过简单的改动，可直接修改；而功能较复杂，多次提交，则不推荐在主分支上修改。

### 功能分支

有新功能时，切出一个功能分支。

```bash
git checkout -b feature/a
```

开发完成后，需要合并回主分支

```bash
git merge feature/a # 快速合并
git merge --no-ff feature/a # 非快速合并
```

如果在创建当前功能分支后，主分支可能有新的提交。

在合并之前，建议先将主分支新的提交合并到当前分支。有两种策略选择：

- 合并

- 变基

合并操作简单，变基操作的提交记录更清晰。开源库推荐变基操作。

合并操作

```bash
git merge master
git checkout master
git merge feature/a
```

变基操作

```bash
git rebase master
git checkout master
git merge feature/a
```

### 故障分支

修复 Bug 的分支。

```bash
git checkout -b bugfix/b
```

在验证没有问题后，需要合并回主分支，并在主分支上发布新的补丁版本。

```bash
git checkout master
git merge --no-ff bugfix/b
# 测试 构建 打标签 发布
```

主分支更新后，下游的公共分支要及时同步变更，建议使用**变基操作**进行同步。

```bash
git checkout feature/a
git rebase master
```

### pull request

其他人给开源项目提交代码合并

### 标签与历史

每次发布新版本都要添加 Git 标签，版本号需要符合语义化规范

```bash
git tag 1.1.1
git tag 1.2.0

#或

git tag v1.1.1
git tag v1.2.0
```

假设最新版本是 v1.2.0，反馈 v1.0.0 版本存在 Bug。

历史版本可以基于标签新建一个版本分支，在版本分支上修复 Bug。需要注意，**历史版本分支不需要再次合并回主分支**。

```bash
git checkout -b v1.0.x v1.0.0
```