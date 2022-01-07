import { left, right } from 'fp-ts/Either'
import {
  integer,
  whitespace,
  whitespaces0,
  delimited,
} from '../src/parser/utils'
import { parser } from '../src/parser'
import { some } from 'fp-ts/Option'

describe('Foobar', () => {
  it('should do shit', () => {
    expect(integer('12901')).toEqual(right([12901, '']))
    expect(integer('12901asas')).toEqual(right([12901, 'asas']))
    expect(whitespace(' ')).toEqual(right([' ', '']))
    expect(whitespace('\n')).toEqual(right(['\n', '']))
    expect(whitespace('a')).toEqual(left(['unable to match', 'a']))

    expect(delimited(whitespaces0, integer, whitespaces0)(' 20 ')).toEqual(
      right([20, ''])
    )
    expect(delimited(whitespaces0, integer, whitespaces0)(' 2 0 ')).toEqual(
      right([2, '0 '])
    )
  })

  it('should maybeshut', () => {
    expect(parser(/^ .\s(\n)\b  \T $/.source)).toEqual(
      right([
        [
          some({ tag: 'Start' }),
          [
            { tag: 'AnyItem' },
            { tag: 'AnyString' },
            { tag: 'Group', exprs: [{ tag: 'AnyNumber' }] },
            { tag: 'AnyBool' },
            { tag: 'Truthy' },
          ],
          some({ tag: 'End' }),
        ],
        '',
      ])
    )

    expect(parser(/^ \s* \T? \n+ $/.source)).toEqual(
      right([
        [
          some({ tag: 'Start' }),
          [
            { tag: 'ZeroOrMore', expr: { tag: 'AnyString' } },
            { tag: 'Optional', expr: { tag: 'Truthy' } },
            { tag: 'OneOrMore', expr: { tag: 'AnyNumber' } },
          ],
          some({ tag: 'End' }),
        ],
        '',
      ])
    )
  })
})
