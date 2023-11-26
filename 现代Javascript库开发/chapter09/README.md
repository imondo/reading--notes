# 命令行工具

构建命令行工具，实现库的快速新建和初始化功能。

## 系统设计

现代库需要很多预设，包括 lint，test，build 等，创建类似 `create-reat-app` 的命令行。

命令行支持的完整功能：

- 核心功能

    - README.md

    - TODO>Md

    - CHANGELOG.md

    - doc

    - LICENSE

    - .gitignore

    - .editorconfig

    - .vscode

    - .github

    - src

    - build 等

- 可选功能

    - eslint

    - prettier

    - commitlint

    - standard-version

    - husky

    - test

## 标准命令行工具

基础知识和开源库 `yargs`

```js
makdir jslib-book-cli
npm init

# add bin/index.js

```

在文件中新增代码

```js
#!/usr/bin/env node
console.log('hello');
```

普通文件并不能直接执行，直接执行文件会报错

```bash
./bin/index.js
zsh: permission denied: ./bin/index.js
```

普通文件没有执行权限，执行命令修改文件权限

```bash
chmod 755 ./bin/index.js
```
执行目录内的命令需要通过相对路径或绝对路径执行。系统为什么可以直接执行？

由于操作系统支持设置 PATH，PATH中路径存在的命令都可以调用

macOS 系统，使用全局变量 $PATH 查看系统

```bash
echo $PATH
/Users/mondo/.nvm/versions/node/v16.15.0/bin:/usr/local/bin:/usr/local/sbin:/usr/local/bin
```

支持自定义路径，修改配置文件后，需要使用 source 命令让配置即刻生效

```bash
vi ~/.bash_profile
export PATH=$PATH:/Users/bin

source ~/.base_profile
```

软链接。在 /usr/local/bin 目录中创建一个软链接，指向执行文件。

```bash
ln -s /Users/jslib-book-cli/bin/index.js /usr/local/bin/hello

hello
```

npm 做了封装，提供简单接口。修改 package.json 文件

```json
{
    "bin": {
        "jslibbook": "./bin/index.js"
    }
}
```

执行 npm link 命令。提示没有权限时，用 sudo 再次执行。

```bash
npm link # sudo npm link
```

**npm link 命令会创建软链接。**

**process.argv 可以获取命令参数。**

`process.argv[2]` 就是传给命令的参数

标准命令行参数需要支持的两种格式

```bash
jslibbook --name=mylib
jslibbook --name mylib
```

`yargs` 专门处理命令行参数问题

```bash
npm install --save yargs
```

yargs.argv.name 获取执行命令是的 name 参数值，执行命令：`jslib-book-cli --name=mylib`

```bash
[
  '/Users/mondo/.nvm/versions/node/v16.15.0/bin/node',
  '/Users/mondo/.nvm/versions/node/v16.15.0/bin/jslib-book-cli',
  '--name=mylib'
]
{ _: [], name: 'mylib', '$0': 'jslib-book-cli' }

```
其提供的 argv 属性是对 process.argv 的封装，yargs.argv 是一个对象，它的接口更好用。可以通过 option 配置参数属性

```js
const argv = yargs.option('name', {
    alias: 'N',
    type: 'string'
}).argv;

console.log(argv);
```

- alias：别名
- type ：参数类型

设置版本信息，自动读取 package.json 文件中的 version 字段。

```js
yargs.alias('v', 'version').argv;
```

执行命令，示例：

```bash
jslib-book-cli -v          

1.0.0
```

yargs 还可以设置帮助信息

- usage：用法格式

- example：提供示例

- help：显示帮助信息

- epilog：出现在帮助信息的结尾

```js
yargs.usage('usage: jslib-book-cli [options]')
    .usage('usage: jslib-book-cli <command> [options]')
    .example('jsblib-book-cli new mylib', 'add new lib')
    .alias('h', 'help')
    .alias('v', 'version')
    .epilog('copyright 2023')
    .demandCommand()
    .argv;
```

执行命令 `jslib-book-cli -h` 可以查看：

```bash
usage: jslib-book-cli [options]
usage: jslib-book-cli <command> [options]

选项：
  -N, --name                                                            [字符串]
  -v, --version, --version  显示版本号                                    [布尔]
  -h, --help                显示帮助信息                                  [布尔]

示例：
  jsblib-book-cli new mylib  add new lib

copyright 2023
```

yargs 还允许通过 command 方法来设置 Git 风格的子命令。

```js
yargs.usage('usage: jslib-book-cli [options]')
    .usage('usage: jslib-book-cli <command> [options]')
    .example('jsblib-book-cli new mylib', 'add new lib')
    .alias('h', 'help')
    .alias('v', 'version')
    .command(['new', 'n'], '新建一个项目', function(argv) {
        return yargs.option('name', {
            alias: 'n',
            default: 'mylib',
            describe: 'your library name',
            type: 'string'
        })
    }, function (argv) {
        console.log(argv);
        // TODO
    })
    .epilog('copyright 2023')
    .demandCommand()
    .argv;
```

执行命令 `jslib-book-cli n -h`


## 交互界面

类似询问式的交互功能。

使用 Inquirer.js 依赖

- 询问用户问题

- 获取并解析用户的输入

- 检测用户的答案是否合法

- 提示错误回调

- 管理多层级的提示

```bash
npm i inquirer -S
```

创建测试文件 test.js

```js
inquirer.prompt([
    {
        type: 'input',
        name: 'name',
        message: '仓库的名称',
        default: 'mylib'
    },
    {
        type: 'confirm',
        name: 'test',
        message: 'Are you test?',
        default: true
    }
]).then(answers => {
    console.log(answers)
})
```

执行文件可以看到提示

```bash
node test.js 
? 仓库的名称 test
? Are you test? Yes
{ name: 'test', test: true }
```

prompt 函数接受一个数组，数组每一项都是一个询问项，询问项配置：

- type: 提问类型，包括 input、confirm、list、rawlist、expand、checkbox、password、editor

- name: 存储当前问题答案的变量

- message: 问题描述

- default: 默认值

- choices: 列表选项

- validate: 对用户的答案进行校验

- filter: 对用户的答案进行过滤处理，返回处理后的值


一个选择示例

```js
    {
        type: 'list',
        name: 'fruit',
        message: '选择水果',
        choices: ['苹果', '香蕉', '梨子'],
        filter: val => {
            const map = {
                苹果: 'apple',
                香蕉: 'banana',
                梨子: 'pear'
            }
            return map[val]
        },
        default: true
    }
```
最终得到选择的参数

```bash
? 选择水果 (Use arrow keys)
❯ 苹果 
  香蕉 
  梨子
{ name: 'mylib', test: true, fruit: 'apple' } 
```

## 初始化功能

按功能拆分模块

- root：公共文件

- build：构建类

- prettier：格式化

- eslint：ESLint 配置

- commitlint：提交信息校验

- test：单元测试

- husky：Git hook 校验

- ci：持续集成，包含 GitHub Action

## 代码架构

确认方案，实现代码。在获取用户配置信息后，调用初始化函数

```js
#!/usr/bin/env node
const yargs = require("yargs");
const { runInitPrompts } = require("./run-prompts");
const { init } = require("./init");

yargs
    // ...
    .command(
        ["new", "n"],
        "新建一个项目",
        function (yargs) {
            return yargs.option("name", {
                alias: "n",
                demand: false,
                default: "mylib",
                describe: "your library name",
                type: "string",
            });
        },
        function (argv) {
            runInitPrompts(argv._[1], yargs.argv).then(function (answers) {
                init(argv, answers);
            });
        }
    )
    .epilog("copyright 2019-2022")
    .demandCommand().argv;
```

抽象 init 函数，该函数只简单调用各个模块的初始化函数，各个模块的具体初始化逻辑由各模块实现，这样就做到了分治和结耦。

```js
const ora = require("ora");
const { checkProjectExists } = require("./util/file");
const root = require("./root");
// ...

function init(argv, answers) {
    const cmdPath = process.cwd();

    const option = { ...argv, ...answers };
    const { name } = option;

    const pathname = String(
        typeof argv._[1] !== "undefined" ? argv._[1] : name
    );

    // 运行命令
    if (!pathname) {
        console.error("error: jslibbook create need name");
        return;
    }

    if (checkProjectExists(cmdPath, pathname)) {
        console.error("error: The library is already existed!");
        return;
    }

    root.init(cmdPath, pathname, option);
    // ....
}

exports.init = init;
```

## 公共逻辑

Node.js 拷贝目录，需要用到递归。推荐使用 copy-dir

```bash
npm install --save copy-dir
```
使用

```js
const copydir = require('copy-dir')

copydir.sync('/a', '/b')
```

单个文件的拷贝

```js
function copyFile(from, to) {
    const buffer = fs.readFileSync(from)
    const parentPath = path.dirname(to)

    mkdirSyncGuard(parentPath)

    fs.writeFileSync(to, buffer)
}

function mkdirSyncGuard(target) {
    try {
        fs.mkdirSync(target, { recursive: true })
    } catch(e) {
        mkdirp(target)
        function mkdirp(dir) {
            if(fs.existsSync(dir)) {
                return true
            }
            const dirname = path.dirname(dir)
            mkdirp(dirname)
            fs.mkdirSync(dir)
        }
    }
}
```

合并 JSON 文件

```js
function mergeObj2JSON(object, to) {
    const json = JSON.parse(fs.readFileSync(to, { encoding: 'utf8' }))

    extend(json, object)

    fs.writeFileSync(to, JSON.stringify(json, null, ' '), { encoding: 'utf8' })
}
```

## 模块设计

- root：初始化逻辑

`chapter09/example/jslib-book-cli/bin/root`

- build：负责 Babel 和 rollup.js 初始化

`chapter09/example/jslib-book-cli/bin/build`

- prettier：负责初始化 prettier 相关功能

`chapter09/example/jslib-book-cli/bin/prettier`

- eslint：负责 ESLint 功能

`chapter09/example/jslib-book-cli/bin/eslint`

- commitlint：负责提交信息标准化工作

`chapter09/example/jslib-book-cli/bin/commitlint`

- test：负责单元测试初始化

`chapter09/example/jslib-book-cli/bin/test`

- husky：负责 Git hook 相关初始化

`chapter09/example/jslib-book-cli/bin/husky`

- ci：负责持续集成相关初始化

`chapter09/example/jslib-book-cli/bin/ci`

## 命令行颜色

需要和用户进行交互，交互包括输入和输出。颜色区分

- 成功消息：绿色

- 失败消息：红色

- 警告消息：橘黄色

- 提示类消息：蓝色

- 普通消息：黑色

使用 chalk 开源库

```
npm install --save chalk@last
```

处理字符串

```js
const chalk  = require('chalk')

console.log(chalk.red('红色'))
console.log(chalk.red.bgGreen('绿底红字'))
console.log(chalk.blod('加粗'))
console.log(chalk.underline('下划线'))
```

包装 console 函数

```js
const error = console.error
const log = console.log
const info = console.info
const warn = console.warn

function init() {
    console.success = function (...args) {
        log(chalk.bold.green(...args))
    }
    console.error = function (...args) {
        error(chalk.bold.red(...args))
    }
    console.warn = function (...args) {
        warn(chalk.hex('#FFA500')(...args))
    }
    console.info = function (...args) {
        info(chalk.bold.blue(...args))
    }
}
exports.init = init;
```

### 进度条

依赖安装

- npm

- yarn

- pnmp

选择包管理工具

```js
function runInitPrompts(pathname, argv) {
    const promptList = [
        {
            type: 'list',
            message: 'package manager',
            name: 'manager',
            default: 'npm',
            choices: ['no install', 'npm', 'yarn', 'pnpm'],
            filter: function(value) {
                return {
                    npm: 'npm',
                    yarn: 'yarn',
                    pnpm: 'pnpm',
                    'no install': null,
                }[value]
            }
        }
    ]
    return inquirer,prompt(promptList)
}
```

执行命令，可以选择 exec 函数，使用 Promise 包装

```js
const path = require('path')
const { exec } = require('child_process')

function init(cmdPath, name, option) {
    const manager = option.manager
    if (!manager) {
        return Promise.resolve()
    }
    return new Promise(function(resolve, reject) {
        exec(
            'git init',
            { cwd: path.resolve(cwdPath, name) },
            function(error, stdout, stderr) {
                if (error) {
                    console.warn('git init error')
                    reject()
                    return
                }
                exec(
                    `${manager} istall`,
                    { cwd: path.resolve(cwdPath, name) },
                    function(error, stdout, stderr) {
                        if (error) {
                            reject()
                            return
                        }
                        resolve()
                    }
                    
                )
            }
        )
    })
}

module.exports = {
    init: init
}
```

使用 ora 实现命令行加载状态

```
npm install --save ora
```

控制何时加载，中途还可以改变文本和颜色

```js
const ora = require('ora')
const spinner = ora('Loading 1').start()

setTimeout(() => {
    spinner.clolr = 'yellow'
    spinner.text = 'Loading 2'
}, 1000)

setTimeout(() => {
    spinner.succeed('Loading success')
}, 2000)
```

修改安装 manager 模块

```js
const path = require('path')
const { exec } = require('child_process')
const ora = require('ora')

function init(cmdPath, name, option) {
    const manager = option.manager
    if (!manager) {
        return Promise.resolve()
    }
    return new Promise(function(resolve, reject) {
        exec(
            'git init',
            { cwd: path.resolve(cwdPath, name) },
            function(error, stdout, stderr) {
                if (error) {
                    console.warn('git init error')
                    reject()
                    return
                }
                // 开始安装
                const spinner = ora()
                spinner.start(`Installing package from npm, wait for a second...`)
                exec(
                    `${manager} istall`,
                    { cwd: path.resolve(cwdPath, name) },
                    function(error, stdout, stderr) {
                        if (error) {
                            reject()
                            return
                        }
                        spinner.succeed('Install packages successfully')
                        resolve()
                    }
                )
            }
        )
    })
}

module.exports = {
    init: init
}
```

## 发布

发布到 npm 上，修改 package.json

```json
{
    "name": "@jslib-book-cli",
    "publishConfig": {
        "registry": "https://registry.npmjs.org",
        "access": "public"
    },
}
```

如果包名中包含 @，则表示这个包位于改用户名下，位于用户名下的包默认是私有的，只有用户自己能访问。需要其他人能访问，添加参数 --access=public

```bash
npm publish # npm publish --access=public
```

发布后，可以使用 npx 命令执行 cli 命令

```bash
npx @jslib-book-cli n
```

执行 npx 命令会先安装 @jslib-book-cli 包，然后执行其中的命令，npx 好处：每次都会拉取最新的包

```bash
npm install -g @jslib-book-cli
jslib-book-cli n
```