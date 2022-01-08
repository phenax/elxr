import { filter } from '../src'

describe('Basic tests', () => {
  it('should do it', () => {
    expect(filter(/\s/, [1, '2', 3, '4'])).toEqual(['2', '4'])
    expect(filter(/\n/, [1, '2', 3, '4'])).toEqual([1, 3])
    expect(filter(/\T/, [1, 0, '4', ''])).toEqual([1, '4'])
    expect(filter(/\F/, [1, 0, '4', ''])).toEqual([0, ''])
    expect(filter(/\F\T/, [1, 0, '4', ''])).toEqual([])
    expect(filter(/\s\T/, [1, 0, '4', ''])).toEqual(['4'])
  })
})
