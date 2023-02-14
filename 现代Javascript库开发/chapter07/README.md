# 安全防护

## 防护意外

### 最小功能设计

对外提供最小功能，尽可能隐藏内部实现细节。

以前约定，私有属性添加下划线前缀；没有真正的实现隐藏属性。

更好的做法是把私有属性放到函数作用域中。

```js
class Guid {
    constructor() {
        let count = 1
        this.guid = () => {
            return count++
        }
    }
}

const g = new Guid()
g.guid()
g.count // 无法直接访问
```

ES2022 带来了原生私有属性，在属性前加 `#` 前缀。

```js
class Guid {
    #count = 1
    constructor() {
        this.guid = () => {
            return count++
        }
    }
}
```

### 最小参数设计

对外暴露参数尽可能使用简单类型，简单类型更安全，如果是引用类型参数，函数不要直接修改传入的参数。

```js
function fill(arr, val) {
    const newArr = clone(arr)
    // ...
    return newArr
}
```

### 冻结对象

对外使用的接口，可能被人修改，导致开发时运行出错。可以将对外接口冻结。

```js
Object.freeze(obj)
```

## 避免原型入侵

### 面向对象基础知识

数据和对数据的操作封装在一起，被称作面向对象。

猫有布偶猫和狸花猫，狸花猫拥有猫的全部特性，在面向对象中这被称作继承。即**细分事物应该继承抽象事物的特点**。

实现对象和继承有两种思路：`CEOC` 和 `OLOO`

CEOC：`Class Extend Other Class`，基于类和实例的实现方式，类作为对象的抽象描述，对象是类的实例。

OLOO：`Object Link Other Object`，基于对象和关系的实现方式，没有类，只有对象。

### 原型之路

`JavaScript` 的面向对象是基于原型的。

`ES3` 通过设置 `prototype` 属性

```js
function Parent() {}
function Child() {}

function T() {}
T.prototype = Parent.prototype
Child.prototype === new T()
```

`ES6` 类语法

```js
class Parent() {}
class Child extends Parent {}
```

对象继承对象

```js
const parent = {
    a: 1
}
const child = Object.create(parent, {
    b: {
        value: 2,
        writable: true,
        enumerable: true,
        configurable: true
    }
})
```

通过设置 `__proto__` 属性

```js
const parent = {
    a: 1
}
const child = {
    __proto__: parent,
    b: 2
}
```

直接操作原型

```js
const parent = {}
const child = {}
Object.setPrototypeOf(child, parent)
```

直接修改原型，存在性能问题和兼容性问题。

### 原型入侵

所有对象都是继承自 `Object.prototype`。在其添加属性，就会影响所有对象。

```js
Object.prototype.tree = function() {
    console.log(Object.keys(this))
}

const obj = {
    a: 1,
    b: 2
}
obj.tree() // [1, 2]
```

使用上面原型会带来两个问题：

- 给所有对象增加一个可枚举的方法

- 实现冲突，不同库可能会扩展同一个方法，如果实现不一致，就会产生冲突。

**一定不要扩展原型属性。**

## 原型污染事件

Lodash 2019 的安全漏洞。

### 漏洞原因

隐患数据，可以修改原型上的 toString 方法

```js
const payload = '{ "constructor": {"prototype": {"toString": true}}}'
_.defaultDeep({}, JSON.parse(payload))
```

### 详解原型污染

`JavaScript` 每个对象都有一个 `__proto__` 属性指向自己的原型。

```js
const person = { name: 'Mondo' }
console.log(person.__proto__) // Object.prototype
console.log(Object.prototype.__proto__) // null
```

**对象的 `__proto__` 属性组合成一条链，这条链就叫做原型链。**

所有对象的原型链顶端都是 `Object.prototype`，它的原型是 `null`，`null` 没有原型。

![proto.png](/assets/proto.png)

原型污染用到原型链的两个关键知识：

- 修改 `Object.prototype` 会影响所有对象

- 通过对象的 `__proto__` 属性可以获取对象的原型引用

```js
const person = {
    name: 'mondo'
}

console.log(person.name) // mondo

person.__proto__.toString = () => {
    alert('imondo.cn')
}

console.log(person.name) // mondo

const person2 = {}

console.log(person2.toString()) // 弹出 imondo.cn
```

每个对象都有一个 `toString` 方法，当对象被表示转换成基础数据时，会自动调用该方法，如果被覆盖，后果可想而知。

### 防范原型污染

`Lodash` 是怎么修复的？

```js
function safeGet(object, key) {
    if (key === 'constructor' && typeof object[key] === 'function') {
        return;
    }

    if (key === '__proto__') {
        return;
    }
}
```
遇到 `constructor` 或者 `__proto__` 敏感属性，则退出程序。

如何防止：

- 冻结 `Object.prototype`，使原型不能扩充属性。 使用 `Object.freeze` 冻结。

- 规避不安全的递归性合并，对敏感属性跳过。

- `Object.create(null)` 的返回值不会连接到 `Object.prototype`，这样无论扩充对象，都不会干扰原型。

```js
let foo = Object.create(null)
console.log(foo.__proto__) // undefined
```

- 使用 `Map` 数据结构代替 `Object` 类型。

### JSON.parse 补充

同样存在风险的有 `JSON.parse` 方法

```js
JSON.parse('{"a": 1, "__proto__": { "b": 2 }}')
```
打印发现，复写 `Object.prototype` 失败了，`__proto__` 属性会被忽略。

## 依赖的安全问题

依赖的代码不可控因素太多。

### 库的选择

如何筛选一个安全的库？

`GitHub` 信息

- `Star` 数代表库的知名度

- `Issues` 反映库的质量，是否积极维护

- `npm` 下载量

### 正确区分依赖

不同类型的依赖：

- `dependencies`

- `devDependencies`

- `peerDependencies`

- `bundleDependencies`

- `optionalDependencies`

默认安装会添加到 `dependencies` 依赖。

`npm` 安装 `--save` 添加到 `dependencies` 依赖

`npm` 安装 `--save-dev` 添加到 `devDependencies` 依赖

如果某个库需要依赖别的库才能使用，可以用到 `peerDependencies` 依赖，如：编写一个 `React` 插件，则可以将 `React` 作为插件的 `peerDependenices` 依赖

```json
{
    "peerDependenices": {
        "react": "^17.0.2"
    }
}
```

`npm` 在安装这个插件时，会检测这个库 `peerDependenices` 中的依赖是否存在，不存在会给出警告提示⚠️

### 版本问题

语义化版本 `SemVer 2.0`，规定版本号格式 `主版本号.次版本号.修订号`

- 主版本号：当做了不兼容 `API` 修改时

- 次版本号：做了向下兼容的功能性新增时

- 修订号：做了向下兼容的问题修正时

版本号前缀

```json
{
    "dependencies": {
        "lodash": "^4.17.21", // 前缀为 ^，固定主版本，次版本和修订版本可以升级
        "lodash": "~4.17.21", // 前缀为 ～，固定主版本，次版本；修订版本可以升级
        "lodash": "4.17.21", // 无前缀，固定版本
    }
}
```

通过 `npm` 安装一个库时，默认在版本号前加 `^`，也可修改

```bash
npm config set save-prefix="~"
npm config set save-prefix=""
```

对于 `dependencies` 和 `preeDependencies` 版本号，建议 `^` 做为前缀，可以避免重复安装依赖；对于 `devDependenices` 建议固定版本号，避免每次安装时版本不一致。

`npm v5` 引入 `lock` 文件，对整个 `node_modules` 目录做了记录，保证下次安装时的一致性。

### 依赖过期

执行 `npm outdated` 命令检查过时的依赖信息

```bash
npm outdated
```

![outdated.png](/assets/outdated.png)

### 安全检查

执行 npm audit 命令进行安全审核，扫描依赖是否存在漏洞。

```bash
npm audit
```

核心原则：不要太依赖其他的库。