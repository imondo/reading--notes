export function type(x) {
    const t = typeof x

    if (x === null) {
        return 'null'
    }

    if (t != 'object') {
        return t
    }

    const toString = Object.prototype.toString

    const innerType = toString.call(x).slice(8, -1)

    const innerLowType = innerType.toLowerCase()

    // 区分 new String()
    if (['String', 'Number', 'Boolean'].includes(innerType)) {
        return innerType
    }

    // 区分 function A() {} new A
    if (innerType != 'Math' && x?.constructor?.name !== innerType) {
        return x.constructor.name
    }
    return innerLowType
}