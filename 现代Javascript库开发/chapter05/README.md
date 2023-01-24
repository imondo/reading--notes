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