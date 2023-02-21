# 抽象标准库

通用功能抽象成基础库

## 类型判断

### 背景知识

数据为空，防御式编程，误区之一使用非运算符直接判断。

误判假值：`0`、`空字符串`、`false`、`null`、`undefined`。

```js
function double(x) {
    // 0 会被错误计算
    if (!x) {
        return NaN;
    }
    return x * 2
}
```

判断处理，直接与 `null` 和 `undefined` 比较处理

```js
function double(x) {
    if (x === null || x === undefined) {
        return NaN;
    }
    return x * 2
}
```

又引出另外的问题，`undefined` 并不是关键字，而是 `window` 上的属性，可以被重新赋值，存在改写问题

```js
window.undefined = 1;
function double(x) {
    if (x === null || x === undefined) {
        return NaN;
    }
    return x * 2
}
```

使用 `typeof` 操作符判断 `undefined`，通过内部类型判断，不存在 `undefined` 变量覆盖问题

```js
window.undefined = 1;
function double(x) {
    if (x === null || typeOf x === 'undefined') {
        return NaN;
    }
    return x * 2
}
```

`number` 类型数据判断问题。特殊值 `NaN`，`NaN` 的类型也是 `number`，通常计算失败时会得到这个值。

添加 `isNaN` 判断。

```js
const x = Math.sqrt(-1) // NaN
if (typeof x === 'number' && !isNaN(x)) {
    console.log(x.toFixed(2))
}
```

也可以使用 `ES6` 中的 `Number.isNaN` 方法，和全局函数 `isNaN` 相比，**它不会自行将参数的类型转换成数字类型**，`Number.isNaN` 逻辑如下：

```js

isNaN('a') // true
isNaN('1') // false

Number.isNaN('a') // false
Number.isNaN('1') // false

Number.isNaN = function(val) {
    return typeof val === 'number' && isNaN(val)
}
```

`typeof` 操作符问题。`typeof` 只能判断基础数据类型，不能判断引用数据类型，等到的值都是 `object`

```js
typeof [] // object
typeof {} // object
typeof null // object
```

可以使用 `instanceof` 操作符来检测引用数据类型，其原理是检测 `constructor.prototype` 是否存在参数 `object` 的原型链上。

```js
{} instanceof Object // true
[] instanceof Array // true 
/reg/ instanceof RegExp // true
```

使用 `instanceof` 做类型判断时，存在不够准确问题。

```js
[] instanceof Object // true
[] instanceof Array // true 

// 这是由于 Object.prototype 是所有对象的原型
```

顺序问题，顺序错误，也得不到正确答案

```js
function type(x) {
    if (x instanceof Object) {
        return 'object'
    }
    // Array 永远得不到正确的类型
    if (x instanceof Array) {
        return 'array'
    }
}
type([]) // object
```

数组类型使用 `Array.isArray` 判断

```js
Array.isArray([]) // true
Array.isArray(1) // false
```

借助 `Object.prototype.toString.call` 获取数据内部类型

```js
const type = Object.prototype.toString.call
type({}) // [object Object]
type(null) // [object Null]
type(undefined) // [object Undefined]
```

`ES2015` 引入 `Symbol.toStringTag` 属性，可以修改内部类型的值，这会影响 `toString` 方法的返回值

```js
const toString = Object.prototype.toString

const obj = {}

toString.call(obj) // [object Object]
obj[Symbol.toStringTag] = 'MyObject' // 修改内部类型
toString.call(obj) // [object MyObject]
```

### 抽象库

类型判断库

```js
export function type(x) {
    return 'unknow'
}
```

先解决基础类型判断

```js
export function type(x) {
    const t = typeof x

    if (x === null) {
        return 'null'
    }

    if (t != 'object') {
        return t
    }

    return 'unknown'
}
```

添加单元测试

```js
const expect = require('expect.js')
const type = require('../src/utils.js').type

describe('type 类型库测试', () => {
    it('基础类型', () => {
        expect(type(undefined)).to.equal('undefined')
        expect(type(null)).to.equal('null')
        expect(type(true)).to.equal('boolean')
        expect(type(1)).to.equal('number')
        expect(type('1')).to.equal('string')
        expect(type(Symbol())).to.equal('symbol')
    })
})
```

对象数据类型，可以使用 toString 方法获取数据的内部数据

```js
export function type(x) {
    //...

    const toString = Object.prototype.toString

    const innerType = toString.call(x).slice(8, -1)

    const innerLowType = innerType.toLowerCase()

    return innerLowType

}
```

添加相应的单元测试

```js
it('引用类型', () => {
    expect(type({})).to.equal('object')
    expect(type([])).to.equal('array')
    expect(type(/a/)).to.equal('regexp')
    expect(type(Math)).to.equal('math')
})
```

Boolean，Number，String 3个基本类型有对应的包装类型，包装类型需要使用 new 操作符创建

```js
new Boolean(true) === true // false
new String('1') === '1' // false
new Number(1) === 1 // false
```

现在还不能区分这两种类型

```js
type(1) // number
type(new Number(1)) // number
```

添加判断，区分两种类型

```js
export function type(x) {
    // ...
    if (['String', 'Number', 'Boolean'].includes(innerType)) {
        return innerType
    }
}
```

添加单元测试

```js
it('包装类型', () => {
    expect(type(new String('1'))).to.equal('String')
    expect(type(new Number(1))).to.equal('Number')
    expect(type(new Boolean(true))).to.equal('Boolean')
})
```

区分普通对象实例和通过自定义构造函数创建的对象实例

```js
function A() {}
const a = new A()

type({}) // object
type(a) // object
```

可以通过访问对象原型上的 constructor 属性来获取构造函数，获得函数名字，返回名字

```js
function A() {}
const a = new A()

console.log(a.constructor.name) // A
```

添加判断

```js
export function type(x) {
    // ...
    // 区分 function A() {} new A
    if (innerType != 'Math' && x?.constructor?.name !== innerType) {
        return x.constructor.name
    }
}
```

添加单元测试

```js
function A() {}
it('实例对象', () => {
    expect(type(new A())).to.equal('A')
})
```

## 函数工具

抽象通用功能。

### once

