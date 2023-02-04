# 设计更好的 JavaScript 库

## 设计更好的函数

函数是逻辑的集合，也是复用的最小单元。

### 函数的命令

- 准确

- 简洁

准确是设计好的函数的基本要求。名称需要准确的描述其功能。

简洁需要一些练习和灵感才可以达到。

```js
// 获取文件后缀名，extname 更简洁
function extname() {}
function getFileExtName() {}
```

### 参数个数

函数参数个数越少越好。个数最好不要超过 3 个，2 个更好。

当输入数据和选项数据多于两个时，建议进行**对象化改造**。

```js
function getParams(url, key, sep = '&', eq = '=') {}
function getParams(url, key, apt = { sep = '&', eq = '=' }) {}
```

对象化控制了参数的数量。

### 可选参数

可选参数需要提供默认值。

放到函数最好面，当多于两个时，建议使用对象化思路。

```js
function getParams(url, key, sep = '&', eq = '=', arrayFormat = 'comma') {}
function getParams(url, key, apt = { sep = '&', eq = '=', arrayFormat = 'comma' }) {}
```

### 返回值

函数返回值的类型应该保持一致，如果返回值类型不一致，则函数可能承载着太多功能，建议拆分函数。

```js
function getParams(url, key) {
    if (url) {
        // ... 
    }
    // 默认返回值 undefined
}
```
返回值类型不一致，则可能会报错。

```js
getParmas(url, 'a').toString(16) // error
```

更好的做法是保持返回值类型一致，边界情况，额外处理返回值。

```js
function getParams(url, key) {
    if (url) {
        // ... 
    }
    return ''
}
```

## 提高健壮性

### 参数防御

参数进行校验和转换规则：

- 如果参数传递给系统函数，则可以把校验下沉给系统函数处理

- 对 `object`、`array`、`function` 类型参数，要做强制校验，校验失败，则执行异常流程

- 对 `number`、`string`、`boolean` 类型参数，则作自动转换

    - 数字使用 `Number` 函数进行转换

    - 整数使用 `Math.round` 函数转换

    - 字符串使用 `String` 函数转换

    - 布尔值使用 `!!` 转换

- 对于 `number` 类型参数，转换完是 NaN，则执行异常流程

- 对于复合类型的内部数据，也要进行上面的步骤校验

### 副作用处理

副作用：

- 修改环境信息：系统变量和设置全局数据

- 修改函数参数：对象类型，修改其属性，会直接影响外面的内容

```js
function omit(data, keys) {
    for (const k of data) {
        delete data
    }
    return data
}

const obj1 = {
    a: 1,
    b: 2
}
const obj2 = omit(obj1, ['b'])
```

### 异常捕获

异常情况，使用捕获异常进行防御。

```js
function safeparse(str) {
    try {
        return JSON.parse(str)
    } catch (e) {
        return str
    }
}
```

## 浏览器兼容

确定兼容性目标。兼容性越好，服务的用户越多。

### String

`String.prototype.trim` 是 `ES6` 新增的函数，去除字符串前后的空格。

```js
' abv '.trim(); // 'abv'

// replace + 正则表达式兼容性更好
' abc '.replace(/^\s+|\s+$/g, '')
```
`String.prototype.trimStart` 是 ES2021 新增的函数，去除字符串开始的空格。

```js
' abv '.trim(); // 'abv '

// replace + 正则表达式兼容性更好
' abc '.replace(/^\s+/g, '')
```

`String.prototype.replaceAll` 是 ES2021 新增的函数，去除字符串所有匹配的字符。

```js
'aba'.replaceAll('a', 'b'); // 'bbb'

// replace + 正则表达式兼容性更好
' abc '.replace(/a/g, 'b')
```

### Array

`Array.from` 是 ES6 新增的函数，将类数组转换为数组。

```js
Array.from(document.querySelectorAll(*))

// slice 兼容更好
Array.prototype.silce.call(document.querySelectorAll(*))
```

`Array.prototype.flat` 是 ES2019 新增的函数，将多维数组转成一维数组。

```js
[1, [2, 3]].flat(); // [1, 2, 3]

// 递归实现
function flat(arr) {
    return arr.reduce((sum, v) => 
        sum.concat(Array.isArray(v) ? flat(v) : v), []
    )
}
flat([1, [2, 3]])
```

### Object

`Object.values` 是 `ES2017` 新增的函数，其功能是获取对象的属性数组。

```js
const obj = {
    a: 1, 
    b: 2
}
Object.values(obj) // [1, 2]

// 使用 ES6 的 keys
Object.keys(obj).map(key => obj[key])
```

`Object.entries` 是 `ES2017` 新增的函数，其功能是获取对象健和属性数组。

```js
const obj = {
    a: 1, 
    b: 2
}
Object.entries(obj) // [['a', 1], ['b', 2]]

// 使用 ES6 的 keys
Object.keys(obj).map(key => [key, obj[key]])
```

## 支持 TypeScript

JavaScript 是动态类型语言，动态类型语言的缺点就是类型错误发现的太晚，类型错误只有到运行时才能被发现。

```js
function trimStart(str) {
    return str.replace(/^\s+/, '')
}
trimStart(111) // error
```

上面调用函数只有在函数运行时才会报错。

动态类型不适合多人协作的大型应用，特别是在重构其他人编写的代码时，为了解决 `JavaScript` 动态类型的问题，`TypeScript` 被设计出来。

```js
function trimStart(str: string) {
    return str.replace(/^\s+/, '')
}
trimStart(111) // 编译时会报错
```

`JavaScript` 库缺少类型信息，解决方案时是**手写声明文件**。`TypeScript` 会默认查找库目录下的 index.d.ts 文件，并使用里面的类型作为库的类型。

```ts
// index.d.ts

// 由于这里只是类型定义，没有函数实现，因此需要添加关键字 declare
declare function trimStart(str: string): boolean
```

声明文件需要用到常用的基础知识：

```ts
declare var c: boolean
declare var a: number
declare var b: string
declare var d: undefined
declare var z: null

// 数组
declare var arr1: boolean[]
declare var arr2: Array<boolean>

// 对象
interface Obj {
    a: string;
    b: number;
}

// 函数
declare function f1(a: string): boolean
declare function f2(a: string, b?: number): boolean

// interface 参数
declare function f3(a: string, c: Obj): boolean

// 泛型
declare function f4<T>(str: string): T
```

上面声明的变量都是局部作用域，需要暴露出来则在前面加上关键词 `export`

```ts
export declare function f1(a: string): boolean
```