# 前端模版库实战

## 系统搭建

模版引擎是拼接字符串的最佳实践。

### 背景知识

使用 JavaScript 动态创建 HTML 太繁琐。

模版引擎需要解决两个问题：

- 如何将 HTML 中的值动态插入

- 如何在 HTML 中表达逻辑

```js
const tmpl = `
    <ul>
        <%list.map(item => {%>
            <li>姓名：<span><%=item.name%></span></li>
        <%})%>
    </ul>
`
const list = [{name: 'mondo'}]
document.getElementById('#container').innerHTML = template(tmpl, {list})
```

### 搭建项目

模版引擎中包括多个模版，每个模版都是一个完整的独立项目。

使用 monorepo 管理方式。把多个模块放在一个仓库中，通过目录划分模块。

存在问题：虽然多个模块被放到一个仓库中，但还是需要使用 link。

解决方案：借助包管理工具 yarn 的 workspace。

yarn 依赖 Node.js 的依赖查询机制，对于一个依赖，Node.js 会先在自己目录下的 node_modules 目录中查找，如果找不到，就会在父目录下 node_modules 目录中查找。递归这个过程直到找不到为止。

如何使用？

修改 package.json 

```json
{
    "private": true,
    "workspace": ["project", "project2"]
}
```

根目录执行 yarn install 命令，会自动安装每个子项目依赖。

yarn workspace 提供批量执行命令能力，例如，每个子项目都要执行 build 命令时，可以使用如下命令，依次执行每个项目的 build 命令。

```bash
yarn worksapce run build
```

解决了本地开发体验，但是发布包的操作仍需每个包单独操作，写脚本批量发布。

使用 Lerna 配置。根目录安装依赖需加上参数 -W。

```bash
yarn add lerna -W
```

初始化

```bash
npx lerna init
```
根目录创建 lerna 的配置文件 lerna.json。Lerna 要求将子仓库放在 package/* 目录中。

version 是库版本，如果指定版本号，则所有包会统一使用这个版本，如果想要不同的包独立版本，则将 version 的值设置为 independent。

```json
{
    "packages": ["packages/**"],
    "version": "0.0.0"
}
```

Lerna 和 yarn 配合使用还需添加字段

```json
{
    "npmClient": "yarn",
    "useWorkspaces": true,
    "packages": ["packages/**"],
    "version": "0.0.0"
}
```

bootstrap 代替 yarn install 命令

```bash
lerna bootstrap
```

执行上命令，安装所有依赖项，并自动执行 npm link 命令。

## 解析器

字符拼接，三种情况：

- 纯 HTML 片段

```js
tokens = ['<div></div>']
```

- 逻辑片段后面没有其他 HTML 字符串，切分完，对应的数组包含一项

```js
// <%= name%>
tokens = ['= name']
```

- 逻辑片段后面存在其他 HTML 字符串，切分完，对应的数组包含两项

```js
// <%= name%><div>123</div>
tokens = ['= name', '<div>123</div>']
```

解析器主代码

```js
export function parse(tpl) {
    const [sTag, eTag] = ['<%', '%>']
    let code = ''
    const segments = String(tpl).split(sTag)

    for (const segment of segments) {
        const tokens = segment.split(eTag)
        if (tokens.length === 1) {
            // 第一种情况
            code += parsehtml(tokens[0])
        } else {
            // 第二种情况
            code += parsejs(tokens[0])
            if (tokens[1]) {
                // 第三种情况
                code += parsehtml(tokens[1])
            }
        }
    }
    return code
}
```

parsehtml 函数将 HTML 代码按换行符分隔遍历。结果拼接到 __code__。

```js
export function parsehtml(html) {
    // 单双引号转义
    html = String(html).replace(/('|')/g, '\\$1')
    const lineList = html.split(/\n/)
    let code = ''
    for (const line of lineList) {
        code += ';__code__ += ("' + line + '")\n'
    }
    return code;
}
```

parsehtml 函数的实际输出

```js
parser.parse(`
<div>
    <span></span>
</div>
`)
// 上面代码的输出如下
// ;__code__ += ("")
// ;__code__ += ("<div>")
// ;__code__ += ("    <span></span>")
// ;__code__ += ("</div>")
// ;__code__ += ("")
```

parsejs 函数设计，通过正则表达式来判断代码类型，如果是模版插值，则拼接到 __code__；如果是逻辑片段，则直接作为代码拼接。

```js
export function parsejs(code) {
    code = String(code)
    const reg = /^=(.*)$/
    let html;
    let arr;
    // =
    // =123 ['=123', '123']
    if ((arr = reg.exec(code))) {
        html = arr[1]
        return ';__code__ += (' + html + ')\n'
    }
    return ';' + code + '\n'
}
```

输出结果

```js
parser.parse(`
    <div><%= name%></div>
`)
```

```js
parser.parse(`
   <div>
        <% list.forEach(name => {%>
            <%=name%>
        <%})%>
   </div>
`)
```

## 即时编译器

将输出的代码变成可以在浏览器中执行的代码。

字符串不是函数，不能直接执行，new Function 创建动态函数。

使用 eval 将传入的字符串当作 JavaScript 代码执行。

```js
function compiler(tpl) {
    var mainCode = parse(tpl)
    var headerCode = `var __str__ = "";
        var __code__ = "";
        for(var key in data) {
            __str__ += (var key = data[key]);
        }
        eval(__str__)
    ` 
    var footerCode = `return __code__`
    var code = headerCode + mainCode + footerCode
    try {
        return new Function('__data__', code)
    } catch (e) {}
}
```

compiler 返回一个函数，封装一个更高层函数，接收字符串和数据

```js
function template(tpl, data) {
  if (typeof tpl !== 'string') {
    return '';
  }

  try {
    var render = compiler(tpl);
    return render(type(data) === 'Object' ? data : {});
  } catch (e) {
    console.log(e);
    return 'error';
  }
}
```

## 预编译器

即时编译器：是因为其将模版转换为 HTML 代码的过程是在运行时环境处理的，在浏览器中执行代码的话，就在浏览器中处理。

模版大，存在性能问题。

预编译器：把编译过程前置，把模版提前编译为可执行的函数，在运行时可以直接调用函数，省去编译的时间。

esprima，estraverse 解析器，AST 遍历。

`chapter11/jtemplate/packages/precompiler/src/index.js`

## webpack 插件

一切都是模块，CSS、图片等文件都可以被 JavaScript 文件导入。

webpack loader 返回一个函数，参数接收到文件的路径，返回值需要是合法的 JavaScript 代码字符串。

```js
import { precompile } from '@jtemplate/precompile'
export default function(tpl) {
    const source = precompile(tpl)
    return 'module.exports = ' + source
}
```

## VS Code 插件

使用 Yeoman 创建插件

```bash
npm install -g yo
npm install -g yo generator-code
```

运行 yo code 命令，选择 `New Language Support` 创建插件。

生成 `tmLanguage.json` 文件，配置自定义规则

```json
{
    "patterns": [
        {
            "include": "text.html.basic"
        }
    ]
}
```

## 发布

先构建

```bash
yarn workspaces run build
```

使用 Lerna 统一发布。

```bash
npx lerna publish
```