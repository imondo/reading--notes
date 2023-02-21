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

    it('引用类型', () => {
        expect(type({})).to.equal('object')
        expect(type([])).to.equal('array')
        expect(type(/a/)).to.equal('regexp')
        expect(type(Math)).to.equal('math')
    })

    it('包装类型', () => {
        expect(type(new String('1'))).to.equal('String')
        expect(type(new Number(1))).to.equal('Number')
        expect(type(new Boolean(true))).to.equal('Boolean')
    })
    function A() {}
    it('实例对象', () => {
        expect(type(new A())).to.equal('A')
    })
})
