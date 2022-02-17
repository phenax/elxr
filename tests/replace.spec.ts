import { jlog } from '../src/utils'
import { replaceAll } from '../src'

describe('Basic tests', () => {
  it('should', () => {
    expect(
      replaceAll(/"start", \s, \n/, _ => ['replaced'], [
        1,
        'start',
        'x',
        2,
        'start',
        3,
        'start',
        'y',
        4,
      ]),
    ).toEqual([1, 'replaced', 'start', 3, 'replaced'])
  })

  it('should replace matching items', () => {
    expect(replaceAll(/\F/, (_x, _i) => [69], [1, 5, 0, 0, 2, 9, 0])).toEqual([
      1, 5, 69, 69, 2, 9, 69,
    ])

    expect(
      replaceAll(/\s+/, (_x, m) => [(m.value as any).join(',')], [
        1,
        'wow',
        'test',
        [],
        '0',
        2,
        '',
        'nice',
      ]),
    ).toEqual([1, 'wow,test', [], '0', 2, ',nice'])
  })
})
