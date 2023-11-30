# 工具库实战

## 问题背景

每个项目的公共逻辑层存在重复。不能共享，质量参差不齐，整体维护过高

解决思路：将公共逻辑抽离，独立维护，通过 npm 包方式给项目使用

解决方案：

- 抽象工具函数

- 建设项目文档

- 落地方案

## 代码实现

### 字符串操作

当字符串长度没有超过限制，返回原字符串；超过时，截断为指定限制，并在最后添加参数 omi 指定的字符。

```js
function truncate(str, len, omi = '...') {
    str = String(str)
    omi = String(omi)
    len = Math.round(len)

    if (isNaN(len)) {
        return ''
    }

    if (str.length > len) {
        str = str.slice(0, len - omi.length) + omi
    }
    return str
}
```

单元测试

- 先写单元测试，再写代码

- 先写代码，再写单元测试

方式 1 更符合 TDD 原则，通过测试驱动开发。比较复杂的逻辑，建议使用方式 1；简单功能，使用方式 2。

```js
var { truncate } = require('../src/index.js');

describe('测试功能', function () {
  it('异常', function () {
    expect(truncate()).to.be.equal('');
    expect(truncate('')).to.be.equal('');
    expect(truncate('', {})).to.be.equal('');
  });

  it('正常', function () {
    expect(truncate('12345', 5)).to.be.equal('12345');
    expect(truncate('123456', 5)).to.be.equal('12...');
    expect(truncate('123456', 5, '..')).to.be.equal('123..');
  });
});
```

### 数组

生成指定范围的数组。

range 提供 3 个参数，分别是起点、终点、步长。

```js
function range(start, stop, step = 1) {
  start = isNaN(+start) ? 0 : +start
  stop = isNaN(+stop) ? 0 : +stop
  step = isNaN(+step) ? 1 : +step

  // 保证 step 正确
  if (start > stop && step > 0) {
    step = -step
  }
  const arr = []
  for (let i = start; start > stop ? i > stop : i < stop; i += step ) {
    arr.push(i)
  }
  return arr;
}
```

添加单元测试

```js
var expect = require('expect.js');
var { range } = require('../src/index.js');

describe('测试功能', function () {
  it('error', function () {
    expect(range()).to.eql([]);
  });

  it('-2-2', function () {
    expect(range(-2, 2)).to.eql([-2, -1, 0, 1]);
    expect(range(2, -2)).to.eql([2, 1, 0, -1]);
  });

  it('1-10', function () {
    expect(range(1, 5)).to.eql([1, 2, 3, 4]);
    expect(range(5, 1)).to.eql([5, 4, 3, 2]);
  });

  it('1', function () {
    expect(range(2)).to.eql([2, 1]);
    expect(range(-2)).to.eql([-2, -1]);
  });

  it('step', function () {
    expect(range(1, 3, 1)).to.eql([1, 2]);
    expect(range(3, 1, -1)).to.eql([3, 2]);
    expect(range(1, 10, 2)).to.eql([1, 3, 5, 7, 9]);
  });
});
```

### 对象操作

- 从对象中挑选出指定属性

- 从对象中剔除指定属性

对象的几种操作方法：

- ES2016 带来了 `Array.prototype.includes`

- ES2017 带来了 `Object.entries` 方法，可以获取对象的健值对数组

- ES2019 带来了 `Object.fromEntries` 方法，可以将健值对数组转换为新的对象

`Object.entries` 和 `Object.fromEntries` 方法让对象和数组可以相互转化，赋予了对象使用数组的能力。

挑选属性

```js
const obj1 = { a: 1, b: 2, c: 3 }
const obj2 = Object.fromEntries(
  Object.entries(obj1).filter(k => ['a', 'b'].includes(k))
)

console.log(obj2) // { a: 1, b: 2 }
```

结构也可以

```js
const obj1 = { a: 1, b: 2, c: 3 }
const { a, b } = obj1
const obj2 = { a, b }
```

新的语法简化了获取指定属性的代码，但还是需要过程式代码，其语意并不友好。

新建 pick 函数

```js
import { type } from '@jslib-book/type';

// Object.create(null) 的对象，没有hasOwnProperty方法
function hasOwnProp(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function pick(obj, paths) {
  if (type(obj) !== 'Object') {
    return {};
  }

  if (!Array.isArray(paths)) {
    return {};
  }

  const res = {};

  for (let i = 0; i < paths.length; i++) {
    const key = paths[i];
    console.log('key', key, obj[key]);
    if (hasOwnProp(obj, key)) {
      res[key] = obj[key];
    }
  }

  return res;
}
```

单元测试

```js
var expect = require('expect.js');
var { pick } = require('../src/index.js');

describe('测试功能', function () {
  it('异常流程', function () {
    expect(pick()).to.eql({});
    expect(pick(123)).to.eql({});
    expect(pick({})).to.eql({});
    expect(pick({}, 123)).to.eql({});
  });
  it('正常流程', function () {
    expect(pick({ a: 1 }, [])).to.eql({});
    expect(pick({ a: 1, b: 2, c: 3 }, ['a'])).to.eql({ a: 1 });
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c', 'd'])).to.eql({ a: 1, c: 3 });
  });
});
```

### URL 参数处理

```js
function getParam(name, url) {
  name = String(name);
  url = String(url);
  const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
  if (!results) {
    return '';
  }

  return results[1] || '';
}
```

单元测试

```js
var expect = require('expect.js');
var { getParam } = require('../src/index.js');

const urlList = [
  {
    value: 'name',
    url: 'http://localhost:8888/test.html?name=张三&id=123',
    expectation: '张三',
  },
  {
    value: 'random',
    url: 'http://localhost:8888/test.html?name=张三&id=123',
    expectation: '',
  },
];

describe('测试功能', function () {
  it('参数(id)的值', function () {
    urlList.forEach((item) => {
      expect(getParam(item.value, item.url)).to.be.equal(item.expectation);
    });
  });
});
```

## 搭建文档

文档工具

- Docusaurus

- VuePress

每个函数需要清晰作用、参数、返回值、使用示例。

## ESLint 插件

实时提示代码中哪些部分可以使用工具库中的函数代替。

ESLint 推荐使用 Yeoman generator。

```bash
# 安装 Yeoman
npm i -g yo
#初始化 ESLint 插件
npm i -g generator-eslint
#新建目录
mkdir eslint-plugin-utils
#初始化
yo eslint:plugin
```

推荐测试驱动开发

### type-typeof-limit

使用 typeof 操作符判断一个变量为对象可能存在问题。

建立新规则，发现使用 typeof 判断对象时给出错误提示。使用 `yo:eslint:rule` 新建规则

```bash
? What is your name? jslib-book
? What is the plugin ID? type-typeof-limit
? Type a short description of this plugin: typeof 不能用于对象和数组，请使用@jslib-book/type
? Does this plugin contain custom ESLint rules? Yes
? Does this plugin contain one or more processors? No
```

在生成的 rules 文件夹下新建 type-typeof-limit.js 文件

```js
module.exports = {
  meta: {
    type: 'problem', // `problem`, `suggestion`, or `layout`
    docs: {
      description: 'typeof不能用于对象和数组，请使用 @jslib-book/type',
      category: 'Best Practices',
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    fixable: null, // Or `code` or `whitespace`
    schema: [], // Add a schema if the rule has options
  },

  create(context) {
    return {
      BinaryExpression: (node) => {
        const operator = node.operator;
        const left = node.left;
        const right = node.right;

        if (
          (operator === '==' || operator === '===') &&
          left.type === 'UnaryExpression' &&
          left.operator === 'typeof' &&
          right.type === 'Literal' &&
          right.value === 'object'
        ) {
          context.report({
            node,
            message: 'typeof不能用于对象和数组，请使用 @jslib-book/type',
          });
        }
      },
    };
  },
};
```

meta 是规则原数据

- type: 规则类型，problem 代表报错
- docs: 存放规则文档信息

  - description: 指定规则的简短描叙，需要填写

  - category: 指定规则的分类信息，包括 possible errors、best practices

- fixable: 表示这个规则是否提供自动修复功能，当其值被设置为 true 时，还需要提供自动修复的代码

create 函数里面具体的逻辑，其返回一个对象，该对象的属性名表示节点类型，在向下遍历树时，当遍历到和属性名匹配的节点时，ESLint 会调用属性名对应的函数。

ESLint 将每个 JavaScript 文件解析为抽象语树 AST

- BinaryExpression 节点

- left.operator 为 typoof

- operator 为 == 或 ===

- right 为 Literal，且 value 为 object

在插件目录下执行如下命令，将本地插件链接到本地的 npm 全局目录

```bash
npm link
```
修改 eslint-plugin-utils-demo 根目录下的 .eslintrc.js 文件，添加如下代码

```
module.exports = {
    plugins: ["@jslib-book/utils"],
    rules: {
        "@jslib-book/utils/type-typeof-limit": 2
    },
};
```

### recommended

插件可以提供推荐配置，类似 eslint:recommended，用户直接使用推荐的配置即可。

lib/index.js

```js
module.exports = {
  rules: requireIndex(__dirname + '/rules'),
  configs: {
    plugins: ['@jslib-book/utils']
  },
  rules: {
    '@jslib-book/utils/type-typeof-limit': 'error'
  }
}
```

用户直接在项目内配置使用即可

```js
module.exports = {
  extends: ['@jslib-book/utils:recommonded']
}
```

## 数据统计

量化数据

### 统计接入项目

npm 提供的 postinstall 钩子中执行统计代码（4.4章节）

- 下载量

- 包和函数被引用的次数