const expect = require('expect.js')
// const clone = require('../dist/index.js').clone
const clone = require('../src/index').clone

describe('单元测试', () => {
    describe('test hello', () => {
        it('test', () => {
            expect(1).to.equal(1)
        })
    })
})

describe('func clone', () => {
    describe('param data', () => {
        it('正确的测试用例', () => {
            // 基础数据类型
            expect(clone('abc')).to.equal('abc')

            // 数组
            const arr = [1, 2, 3]
            const cloneArr = clone(arr)
            expect(cloneArr).not.to.equal(arr)
            expect(cloneArr).to.eql(arr)

            // 对象
            const obj = {
                a: {
                    b: 1
                }
            }
            const cloneObj = clone(obj)
            expect(cloneObj).not.to.equal(obj)
            expect(cloneObj).to.eql(obj)
        })

        it('边界值测试用例', () => {
            expect(clone()).to.equal(undefined)
            expect(clone(undefined)).to.equal(undefined)
            expect(clone(null)).to.equal(null)
        })
    })
})

