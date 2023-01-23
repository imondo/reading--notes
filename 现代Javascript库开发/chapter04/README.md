# 开源

## 开源协议

|     | MIT  | BSD  | Apache  |
|  ----  | ----  | ----  | ----  |
| 商业用途 | ✓ | ✓ |✓ |
| 可以修改 | ✓ | ✓ |✓ |
| 可以分发 | ✓ | ✓ |✓ |
| 授予专利许可 |  |  |✓ |
| 私人使用 | ✓ | ✓ |✓ |
| 商标使用 |  |  |X|
| 承担责任 | X | X |X |

影响力较大的项目，使用 `MIT` 和 `Apache` 协议更多一些。

一般库可以选择 `MIT` 协议，不过涉及到专利技术，可以选择 `Apache` 协议。

## 文档完善

文档格式推荐使用 `Markdown` 语法。文档内容应该包括：

- README

- 待办清单

- 变更日志

- API 文档

### README

书写原则：主题清晰、内容简介。

- 库的介绍：概括介绍库解决的问题

- 使用者指南：帮助开发者快速了解如何使用

- 贡献者指南：方便社区为开源库贡献

### 待办清单

记录即将发布的内容或未来的计划。

目的：

- 告诉使用者当前库未来会支持的功能

- 提醒库开发者将来要交付的功能

```markdown
# 待办清单

列出完成的功能和未来要添加的功能

- [x] 完成基本 clone 功能

- [ ] 支持大数据拷贝

- [ ] 支持保留引用关系
```

### 变更日志

记录每次更新详细的变更内容。

目的：

- 方便库使用者升级版本时了解升级的内容，规避升级风险

- 记录变更备忘

记录变更版本号、变更时间和具体的变更内容，变更内容尽量做到简洁明了。

创建 `CHANGELOG.md`

```markdown
# 变更日志

## 0.1.0 / 2023.01.23

- 新增功能 A

- 新增功能 B
```

### API 文档

- 功能较少，直接写在 README 文件上

- 内容较多，可以单独写一个文件

- 数量众多，创建文档站

## 发布

发布到 GitHub 和 npm 上。

发布 GitHub 可自行了解。

### 发布 npm

理论上，只需发布 `dist` 目录和 `LICENSE` 文件

黑名单和白名单过滤方式

- 黑名单：`.npmignore` 文件

```bash
config
doc
src
test
```

- 白名单

在 `package.json` 添加 `files` 字段，只有在 files 中的文件才会被发布

```json
{
    "files": ["/dist", "LICENSE"]
}
```

运行 `npm pack --dry-run` 验证哪些文件会被发布。

npm 通过版本号管理一个库的不同版本；版本规则 `x.y.z-prerelease`

- `x` 主版本号，代表不兼容的改动

- `y` 次版本号，代表新增了功能，向下兼容

- `z` 修订号，BUG 修复，向下兼容

- `prerelease` 先行版本号，可选，可以加 `.` 分割任意字符；如：`alpha.1`、`beta.1`

`prerelease` 一般用来发布测试版本，在程序未稳定时，可以先发布测试版本，稳定后发布正式版本

```bash
# 测试版本号
1.0.0-alpha.1
1.0.0-beta.1

# 正式版本号
1.0.0
1.0.1
```

发布正式包和测试包示例：

```bash
npm publish --tag=beta # 发布测试包
npm publish # 发布正式包
```

发布包添加参数，修改 `package.json` 文件，添加 `publishConfig` 字段

```json
{
    "publishConfig": {
        "registry": "https://registry.npmjs.org", // 发布地址
        "access": "public" // 公开包
    }
}
```

发布成功后，需要添加 `Git tag`。如果没有 Git tag，当想要找到历史上某个版本对应的源代码时，只能找 Git 历史才能找到。

常用场景给历史版本修复 Bug 时，Git tag 变的很有用

```bash
git tag 1.0.0 # 添加指定版本的 tag
git push --tags # 将 tag 推送至远端
```

## 数据统计

可以在 GitHub 和 npm 对应的地址查看下载和依赖数据

### 自定义数据

npm 提供 pre 和 post 钩子，代表命令执行之前和执行之后

```bash
npm run preinstall
npm install
npm run postinstall
```

通过 `postinstall` 钩子，可实现自定义统计数据。修改 `package.json` 文件，注册 `postinstall` 钩子

```json
{
    "scripts": {
        "postinstall": "node postinstall.js"
    }
}
```

当使用者安装我们库时，会自动使用 `Node.js` 执行 `postinstall.js` 文件

```bash
npm install xxx # 执行 postinstall.js 文件
npm install --ignore-scripts xxx # 不执行 postinstall.js 文件
```

在项目根目录添加 `postinstall.js` 文件

```js
// 需要将 axios 添加依赖项
const axios = require('axios')

axios.get('/tj').then((res) => {
    // 请求成功
})
```

公司内部项目，可以通过这种方式收集更详细信息。对公开项目，应该谨慎使用上述方式收集信息，`postinstall` 钩子常见用法是安装后做一些初始化工作。