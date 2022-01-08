import { left, right } from 'fp-ts/Either'
import {
  integer,
  whitespace,
  whitespaces0,
  delimited,
} from '../src/parser/utils'
import { parser } from '../src/parser'
import { none, some } from 'fp-ts/Option'
import { Expr } from '../src/types'

const plog = (x: any) => console.log(JSON.stringify(x, null, 2))

describe('Foobar', () => {
  it('should do shit', () => {
    expect(integer('12901')).toEqual(right([12901, '']))
    expect(integer('12901asas')).toEqual(right([12901, 'asas']))
    expect(whitespace(' ')).toEqual(right([' ', '']))
    expect(whitespace('\n')).toEqual(right(['\n', '']))
    expect(whitespace('a')).toEqual(left(['unable to match', 'a']))

    expect(delimited(whitespaces0, integer, whitespaces0)(' 20 ')).toEqual(
      right([20, '']),
    )
    expect(delimited(whitespaces0, integer, whitespaces0)(' 2 0 ')).toEqual(
      right([2, '0 ']),
    )
  })

  it('should maybeshut', () => {
    expect(parser(/^ .\s(\n)\b  \T $/.source)).toEqual(
      right([
        [
          some(Expr.Start(null)),
          [
            Expr.AnyItem(null),
            Expr.AnyString(null),
            Expr.Group({ exprs: [Expr.AnyNumber(null)] }),
            Expr.AnyBool(null),
            Expr.Truthy(null),
          ],
          some(Expr.End(null)),
        ],
        '',
      ]),
    )

    expect(parser(/^ \s* \T? \n+ $/.source)).toEqual(
      right([
        [
          some(Expr.Start(null)),
          [
            Expr.ZeroOrMore({ expr: Expr.AnyString(null) }),
            Expr.Optional({ expr: Expr.Truthy(null) }),
            Expr.OneOrMore({ expr: Expr.AnyNumber(null) }),
          ],
          some(Expr.End(null)),
        ],
        '',
      ]),
    )

    expect(parser(/ \s|\b\T|\n /.source)).toEqual(
      right([
        [
          none,
          [
            Expr.Or({
              left: Expr.AnyString(null),
              right: [
                Expr.AnyBool(null),
                Expr.Or({
                  left: Expr.Truthy(null),
                  right: [Expr.AnyNumber(null)],
                }),
              ],
            }),
          ],
          none,
        ],
        '',
      ]),
    )
  })
})
