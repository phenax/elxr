import { left, right } from 'fp-ts/Either'
import {
  integer,
  whitespace,
  whitespaces0,
  delimited,
  many1,
  satifyChar,
} from '../src/parser/utils'
import { parser, propertyName } from '../src/parser'
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
          some(Expr.Start()),
          [
            Expr.AnyItem(),
            Expr.AnyString(),
            Expr.Group({ exprs: [Expr.AnyNumber()] }),
            Expr.AnyBool(),
            Expr.Truthy(),
          ],
          some(Expr.End()),
        ],
        '',
      ]),
    )

    expect(parser(/^ \s* \T? \n+ $/.source)).toEqual(
      right([
        [
          some(Expr.Start()),
          [
            Expr.ZeroOrMore({ expr: Expr.AnyString() }),
            Expr.Optional({ expr: Expr.Truthy() }),
            Expr.OneOrMore({ expr: Expr.AnyNumber() }),
          ],
          some(Expr.End()),
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
              left: Expr.AnyString(),
              right: [
                Expr.AnyBool(),
                Expr.Or({
                  left: Expr.Truthy(),
                  right: [Expr.AnyNumber()],
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

  it('object proprtyu', () => {
    expect(parser(/ [name \s\T] [age \n] /.source)).toEqual(
      right([
        [
          none,
          [
            Expr.PropertyMatch({
              name: 'name',
              exprs: [Expr.AnyString(), Expr.Truthy()],
            }),
            Expr.PropertyMatch({ name: 'age', exprs: [Expr.AnyNumber()] }),
          ],
          none,
        ],
        '',
      ]),
    )
  })
})
