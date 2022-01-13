import { jlog } from '../src/utils'
import { filter, matchAll } from '../src'

describe('Basic tests', () => {
  it('should filter shit', () => {
    expect(filter(/\s/, [1, '2', 3, '4'])).toEqual(['2', '4'])
    expect(filter(/\n/, [1, '2', 3, '4'])).toEqual([1, 3])
    expect(filter(/\T/, [1, 0, '4', ''])).toEqual([1, '4'])
    expect(filter(/\F/, [1, 0, '4', ''])).toEqual([0, ''])
    expect(filter(/\F\T/, [1, 0, '4', ''])).toEqual([])
    expect(filter(/\s\T/, [1, 0, '4', ''])).toEqual(['4'])
  })

  it('should do it', () => {
    // jlog(matchAll(/[age \n]+/, [ {}, { age: 1 }, { age: 2 }, { age: 0 }, '' ]))
    // jlog(matchAll(/[age \n]+/, [ {}, { age: 1 }, '' ]))
    // jlog(matchAll(/([age \n])+/, [ {}, { age: 1 }, { age: 2 }, { age: 0 }, '' ]))
    // jlog(matchAll(/\n+/, [ '', 1, 2, 0, '6', 5, '' ]))
    // jlog(takeLeftWhile((x: number) => x < 5)([1, 2, 3, 4, 5, 6]))

    jlog(
      matchAll(/([age \n][age \T])+/, [
        {},
        { age: 1 },
        { age: 2 },
        { age: 0 },
        '',
      ]).groups,
    )
  })

  describe('matchAll', () => {
    it('should match simple expression', () => {
      expect(matchAll(/\n/, ['b', 1, 2, 'a', 3]).groups).toEqual([
        { value: 1, index: 1 },
        { value: 2, index: 2 },
        { value: 3, index: 4 },
      ])
    })

    it('should match simple expression (AND)', () => {
      expect(matchAll(/\n\T/, [1, 0, 2, '4', '']).groups).toEqual([
        { value: 1, index: 0 },
        { value: 2, index: 2 },
      ])
    })

    it('should match object property matchers', () => {
      expect(
        matchAll(/[age \n][age \T]/, [
          {},
          { age: 1 },
          { age: 2 },
          { age: 0 },
          '',
        ]).groups,
      ).toEqual([
        { value: { age: 1 }, index: 1 },
        { value: { age: 2 }, index: 2 },
      ])
    })

    it('should match object property matchers', () => {
      expect(
        matchAll(/([age \n][age \T])+/, [
          {},
          { age: 1 },
          { age: 2 },
          { age: 0 },
          '',
        ]).groups,
      ).toEqual([
        { value: [{ age: 1 }, { age: 2 }], index: 1 },
      ])
    })
  })
})
