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

只执行一次的函数

```js
export function once(fn) {
    let count = 0
    return function(...args) {
        if (count == 0) {
            count += 1
            return fn(...args)
        }
    }
}
```

### curry

函数柯里化，可以将普通函数变成可以传入部分参数的函数，一个典型的使用场景是可以给函数预设一些参数。

```js
export function curry(func) {
    const len = func.length
    function partial(func, argsList, argsLen) {
        // 当参数的个数到达期望个数时，返回执行结果
        if (argsList.length >= argsLen) {
            return func(...argsList)
        }
        // 当参数个数少于期望个数时，继续返回函数
        return function(...args) {
            return partial(func, [...argsList, ...args], argsLen)
        }
    }
    return partial(func, [], len)
}

function add(x, y) {
    return x + y
}
add(1, 2) // 3

curry(add)(10)(2) // 12
```

### pipe

将指定的函数串行执行，每次将前一个函数的返回值传递给后一个函数作为输入，执行顺序从左往右。

```js
export function pipe(...fns) {
    return function (...args) {
        return fns.reduce((prevRes, fn) => fn(...prevRes), args)
    }
}

const a = () => {
    console.log('a')
}
const b = () => {
    console.log('b')
}
const c = () => {
    console.log('c')
}

pipe(a, b, c)()
```

### compose

和 pipe 函数类似，只是执行顺序从右往左。

```js
export function compose(...fns) {
    return function (...args) {
        return fns.reduceRight((prevRes, fn) => fn(...prevRes), args)
    }
}

```

被设计中间件系统，如 redux 的中间件设计

```js
export function compose(...funcs) {
    if (funcs.length === 0) {
        return (arg) => arg
    }
    if (funcs.length === 1) {
        return fns[0]
    }
    return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

## 数据拷贝

深浅拷贝都是针对引用类型数据。

- 基本类型

- 引用类型：地址的拷贝，指向一致

- 浅拷贝：遍历对象第一层属性

```JS
function shallowClone(source) {
    var target = {};
    for(var i in source) {
        if (source.hasOwnProtype(i)) {
            target[i] = source[i]
        }
    }
    return target;
}
```

- 深拷贝：浅拷贝 + 递归

```js
function clone(source) {
    var target = {}
    for(var i in source) {
        if (source.hasOwnProtype(i)) {
            if (typeof source[i] === 'object') {
                target[i] = clone(source[i])
            } else {
                target[i] = source[i]
            }
        }
    }
    return target
}
```

存在的问题：

- 没有对参赛校验

- 对象判断不严谨

- 没有考虑数组类型

- 爆栈：数据层级太**深**引发栈溢出，数据**广度**不会

指定生成数据

```js
function createData(deep, breadth) {
    var data = {}
    var temp = data
    for (var i = 0; i < deep; i++) {
        temp = temp['data'] = {}
        for (var j = 0; j < breadth; j++) {
            temp[j] = j
        }
    }
    return data
}

createData(1, 3) // 1 层深度，每层 3 个数据 { data: { 0: 0, 1: 1, 2: 2 } }
createData(3, 0) // { data: { data: { data: {} } } }
```


### 一行代码的深拷贝

```js
function cloneJSON(source) {
    return JSON.parse(JSON.stringify(source))
}
```

数据层级深，也会引发栈溢出，内部也是使用递归的方式。


### 暴力破解爆栈

- 消除尾递归

- 不用递归

```js
var a = {
    a1: 1,
    a2: {
        b1: 1,
        b2: {
            c1: 1
        }
    }
}

function cloneLoop(x) {
    const root = {}
    // 栈
    const loopList = [
        {
            parent: root,
            key: undefined,
            data: x
        }
    ]

    while (loopList.length) {
        // 深度优先
        const node = loopList.pop()
        const parent = node.parent
        const key = node.key
        const data = node.data

        // 初始化赋值目标
        let res = parent
        if (typeof key !== 'undefined') {
            res = parent[key] = {}
        }

        for (let k in data) {
            if (data.hasOwnProperty(key)) {
                if (typeof data[key] == 'object') {
                    // 下次循环
                    loopList.push({
                        parent: res,
                        key: k,
                        data: data[k]
                    })
                } else {
                    res[k] = data[k]
                }
            }
        }
    }

    return root
}
```

### 破解循环引用

上面方法都会存在引用丢失问题。

```js
var b = {}
var a = {
    a1: b,
    a2: b
}
a.a1 === a.a2 // true

var c = clone(a)
c.a1 === c.a2 // false
```

引入数组 `uniqueList`，用来存储已经拷贝的数组，每次循环遍历时，先判断对象是否已经在数组 `uniqueList` 中，如果在，就不执行拷贝逻辑

```js
function cloneForce(x) {
    const uniqueList = []
    let root = {}
    const loopList = [
        {
            parent: root,
            key: undefined,
            data: x
        }
    ]
    while (loopList.length) {
        const node = loopList.pop()
        const parent = node.parent
        const key = node.key
        const data = node.data

        // 初始化赋值目标，如果 key 为 undefined 则拷贝到 parent 否则拷贝到 parent[key]
        let res = parent
        if (typeof key != 'undefind') {
            res = parent[key] = {}
        }

        // 数据存在
        let uniqueData = find(uniqueList, data)
        if (uniqueData) {
            parent[key] = uniqueData.target
            continue
        }

        // 数据不存在 将拷贝过的数据存起来
        uniqueList.push({
            source: data,
            target: res
        })

        for (let k in data) {
            if (data.hasOwnProperty(k)) {
                if (typeof data[k] == 'object') {
                    loopList.push({
                        parent: res,
                        key: k,
                        data: data[k]
                    })
                } else {
                    res[k] = data[k]
                }
            }
        }
        return root
    }
    function find(arr, item) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].source == item) {
                return arr[i]
            }
        }
    }
    return null
}
```

验证一下，深拷贝可以保留引用关系

```js
var b = {}
var a = {
    a1: b,
    a2: b
}

a.a1 === a.a2 // true

var c = cloneForce(a)
c.a1 === c.a2 // true
```

存在问题：

- 如果保留的引用关系不是我们想要的，就不能用 cloneForce 函数

- cloneForce 函数在对象数量很多时会出现性能问题，所以，当数据量很大时，不适合使用


### 性能对比

影响性能的原因

- 深度

- 每层的广度

测试代码

```js
function runTime(fn, time) {
    var stime = Date.now()
    var count = 0
    while(Date.now() - stime < time) {
        fn()
        count++
    }
    return count
}

runTime(() => {
    clone(createData(500, 1))
}, 2000)
```

- 深度变小，不同函数之间差异变小

- `clone` 和 `cloneLoop` 函数之间差别不大

- 性能对比：`cloneLoop` > `cloneForce` > `cloneJSON`，`clone` 函数受层级影响大

时间复杂度

- `clone` 时间 = 创建递归函数时间 + 每个对象处理时间

- `cloneJSON` 时间 = 循环检测时间 + 每个对象处理时间 * 2

- `cloneLoop` 时间 = 每个对象处理时间

- `cloneForce` 时间 = 判断对象是否缓存中时间 + 每个对象处理时间

## 相等性判断

非严格相等

```js
1 == 1 // true
1 == '1' // true
```

- `undefined` 只和 `null` 相等

- 和 `number` 比较，另一个值会自动转换成 `number`

- 和 `boolean` 比较，另一个值会转换成 `number`

- 值的类型为对象类型，会使用内部的 `toPrimitive` 方法进行转换，可以通过自定义 `Symbol.toPrimitive` 方法来改变返回值

```js
const obj = {
    [Symbol.toPrimitive](hint) {
        console.log(hint)
        if (hint == 'number') {
            return 1
        }
        if (hint == 'string') {
            return 'yan'
        }
        return true
    }
}

obj == 1 // true
obj == '1' // true
obj == true // true
```

严格相等

和非严格相等的区别：不会进行类型转化，当类型不一致时直接返回 `false`

```js
1 === 1 // true
1 === '1' // false
```

例外情况：NaN、+0 和 -0 的问题

严格相等中，NaN 不等于自己，它是 x !== x 成立的唯一情况，判断方法使用 isNaN 和 Number.isNaN

Number.isNaN 此方法不会对传入的参数做类型转换，isNaN 则会做类型转换

```js
NaN === NaN // false

isNaN(NaN) // true
Number.isNaN(NaN) // true

isNaN('mondo') // true 自动转换 number 类型后为 NaN
Number.isNaN('mondo') // false 不进行转换，类型不为 Number，直接返回 false
```

严格相等无法区分 +0 和 -0。

```js
+0 === -0
```

使用严格相等的系统函数：`indexOf` 和 `lastIndexOf` 及 `switch-case` 语句。对于 `NaN` 这些系统函数和语句无法返回正确结果

```js
[NaN].indexOf(NaN) // -1

[NaN].lastIndexOf(NaN) // -1
```

- **同值零（SameValueZero）**是另一种算法，它的功能和严格相等功能一样，除了处理 `NaN` 的方式。

```js
NaN === NaN // 同值零算法
```

ES6 引入的函数，使用了**同值零算法**。

```js
[NaN].includes(NaN) // true

new Set([NaN, NaN]) // [NaN]

new Map([
    [NaN, 1],
    [NaN, 2]
]) // { NaN => 2 }
```

- **同值**也是一种相等算法，和同值零类似，但认为 `+0 != -0`

Object.is 使用了同值算法

```js
Object.is(NaN, NaN) // true

Object.is(+0, -0) // false
```

作用：确认两个值是否在任何情况下功能上都是相同的。

区分 +0 和 -0

```js
[+0].includes(-1) // true

[0].find(v => Object.is(v, -0)) // false
```

4 种算法的区别

|     | 隐式转换  | NaN 和 NaN  |  +0 和 -0  |  
|  ----  | ----  | ----  | ---- |
| 非严格相等(==) | 是 | false | true |
| 严格相等(===) | 否 | false | true |
| 同值零(includes) | 是 | false | true |
| 同值(Object.is) | 是 | false | true |


- `Number` 类型数据存在小数比较问题。

```js
0.1 + 0.2 === 0.3 // false
```

小数的比较：两个数字做减法。差值小于某个很小的数字 `X = 2-52` 次方就认为其相等。常量代表：`Number.EPSILON`

```js
var a = 0.1 + 0.2
a - 0.3 < Number.EPSILON // true
```

抽象成函数

```js
function equalFloat(x, y) {
    return Math.abs(x - y) < Number.EPSILON;
}

equalFloat(0.1 + 0.2, 0.3); // true
```

对象的比较：由于对象指向不同的地址

```js
var a1 = { a: 1 }
var a2 = { a: 1 }
a1 == a2 // false
a1 === a2 // false
Object.is(a1, a2) // false
```
解决方法：

1. 序列化为字符串去比较

```js
JSON.stringify(a1) === JSON.stringify(a2) // true
```

2. 存在部分缺陷

部分值序列化后不可辨认
    
- NaN 序列化后和 null 无法区分

- +0 和 -0 在序列化后无法区分

- 溢出的数字和 null 无法区分

- 普通类型值和包装类型值无法区分

- 函数序列化后和 null 无法区分

```js
const a = {
    a1: NaN,
    a2: null
}
JSON.stringify(a) // { a1: null, a2: null }

const b = {
    b1: +0,
    b2: -0
}
JSON.stringify(b) // { b1: 0, b2: 0 }

const c = {
    c1: Infinity,
    c2: null
}
JSON.stringify(c) // { c1: null, c2: null }

JSON.stringify([1, new Number(1)]) // [1, 1]

JSON.stringify([function a() {}]) // [null]
```

还存在很多值不能序列化

```js
const a = {
    a: undefined,
    b: Symbol(''),
}
JSON.stringify(a) // {} 值都丢失了

JSON.stringify([new Set([1])]) // [{}]
JSON.stringify([new Map([[1, 2]])]) // [{}]

JSON.stringify([/reg/]) // [{}]
JSON.stringify([Math]) // [{}]
JSON.stringify([new Image()]) // [{}]
JSON.stringify([class A{}]) // [{}]
JSON.stringify([new (class A{})()]) // [{}]

// Date 可以被序列化
JSON.stringify(new Date('2023.07.05')) // '"2023-07-04T16:00:00.000Z"'
```

### 抽象库

抽象一个判断变量结构相似的库，实现基本判断。

函数设计

```js
function isEqual(value, other) {}
```

思路：比较两个参数是否相等，如果参数是对象或数组，就递归比较

```js
import { type } from '@type' // 前面的库
export function isEqual(value, other) {
    if (value === other) {
        return true;
    }
    const vType = type(value)
    const oType = type(other)
    // 类型不同
    if (vType !== oType) {
        return false;
    }
    if (vType === 'array') {
        return equalArray(value, other);
    }
    if (vType === 'object') {
        return equalObject(value, other);
    }

    return value === other;
}


function equalArray(value, other) {
    if (value.length !== other.length) {
        return false;
    }
    for (let i; i < value.length; i++) {
        if (!isEqual(value[i], other[i])) {
            return false
        }
    }
    return true;
}

function equalObject(value, other) {
    const vKeys = Object.keys(value);
    const oKeys = Object.keys(other);

    if (vKeys.length !== oKeys.length) {
        return false;
    }
    for (let i; i < vKeys.length; i++) {
        const v = value[[vKeys][i]];
        const o = other[[oKeys][i]];

        if (!isEqual(v, o)) {
            return false
        }
    }
    return true;
}
```

使用

```js
const a1 = { a: 1 }
const a2 = { a: 1 }
isEqual(a1, a2); // true
```

问题：NaN，+0，-0，各种对象比较问题。

存在有人希望区分，有人希望不区分。需要支持自定义比较逻辑，通过扩展函数参数实现

```js
export function isEqual(value, other, { eqNaN = true, eqZero = false }) {}
```

这样基本满足需求，但是存在考虑不到场景。如：使用者希望基于函数名称比较，这种情况，需要设计一个比较函数 `compare`

```js
export function isEqual(value, other, { 
    eqNaN = true, 
    eqZero = false, 
    compare(a, b) { // 自定义比较函数
        if (typeof a === 'function' && b === 'function') {
            return a.name === b.name
        }
    }
}) {}
```

借鉴 `redux` 中间件思路

```js
export function isEqual(value, other, enhancer) {
    const next = () => {
        // 原来的逻辑
    }

    if (type(enhancer) === 'function') {
        return enhancer(next)(value, other);
    }
    return next();
}
```

中间件代码，比较 `NaN` 值。

```js
export function middlewareNaN() {
    return next => (value, other) => {
        if (typeof value === 'number' && typeof other === 'number') {
            if (isNaN(value) && isNaN(other)) {
                return true;
            }
        }
        return next(value, other);
    }
}
```