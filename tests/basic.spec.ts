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
  })

  describe('matchAll', () => {
    it('should match literals', () => {
      expect(
        matchAll(/ -2.05 /, [2, NaN, -2.05, '-2.05', -2.05, 2.05]).groups,
      ).toEqual([
        { value: -2.05, index: 2 },
        { value: -2.05, index: 4 },
      ])
      expect(matchAll(/ true /, [1, true, false, true, 'true']).groups).toEqual(
        [
          { value: true, index: 1 },
          { value: true, index: 3 },
        ],
      )
    })

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
      ).toEqual([{ value: [{ age: 1 }, { age: 2 }], index: 1 }])

      expect(
        matchAll(/ [num \n\T]+ /, [
          null,
          { num: 1 },
          { num: 2 },
          {},
          { num: 0 },
          { num: 3 },
        ]).groups,
      ).toEqual([
        { value: [{ num: 1 }, { num: 2 }], index: 1 },
        { value: [{ num: 3 }], index: 5 },
      ])
    })

    it('should match alternatives', () => {
      expect(
        matchAll(/ -2.01|true|\s\T /, [-2.01, true, false, 'foobar', ''])
          .groups,
      ).toEqual([
        { value: -2.01, index: 0 },
        { value: true, index: 1 },
        { value: 'foobar', index: 3 },
      ])

      expect(
        matchAll(/ [v 1|2|\s\T|3]+ /, [
          { v: 1 },
          { v: 3 },
          { v: 2 },
          null,
          { v: 3 },
          { v: 2 },
          { v: 'wow' },
          { v: '' },
          2,
          3,
          { v: 1 },
        ]).groups,
      ).toEqual([
        { value: [{ v: 1 }, { v: 3 }, { v: 2 }], index: 0 },
        { value: [{ v: 3 }, { v: 2 }, { v: 'wow' }], index: 4 },
        { value: [{ v: 1 }], index: 10 },
      ])
    })

    it('should match sequence of matchers', () => {
      expect(
        matchAll(/ [seperator true], [id \s\T]+ /, [
          // FIXME: Sequence doesn't work with Quantifiers
          { seperator: true },
          { id: '1' },
          { id: '2' },
          { id: '3' },
          { seperator: true },
          { id: '4' },
          { id: '5' },
          { id: '6' },
        ]).groups,
      ).toEqual([
        {
          index: 0,
          value: [
            [{ value: { seperator: true }, index: 0 }],
            [{ value: [{ id: '1' }, { id: '2' }, { id: '3' }], index: 1 }],
          ],
        },
        {
          index: 4,
          value: [
            [{ value: { seperator: true }, index: 4 }],
            [{ value: [{ id: '4' }, { id: '5' }, { id: '6' }], index: 5 }],
          ],
        },
      ])

      expect(
        matchAll(/ true, \n, \s /, [true, 5, 'five', 1, 2, 3, true, 7, 'seven'])
          .groups,
      ).toEqual([
        {
          value: [
            [{ value: true, index: 0 }],
            [{ value: 5, index: 1 }],
            [{ value: 'five', index: 2 }],
          ],
          index: 0,
        },
        {
          value: [
            [{ value: true, index: 6 }],
            [{ value: 7, index: 7 }],
            [{ value: 'seven', index: 8 }],
          ],
          index: 6,
        },
      ])
    })
  })
})
