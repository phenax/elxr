import { left, right } from 'fp-ts/Either'
import {
  digits,
  whitespace,
  whitespaces0,
  delimited,
} from '../src/parser/utils'
import { parser } from '../src/parser'
import { none, some } from 'fp-ts/Option'
import { Expr, Literal } from '../src/types'
import { jlog } from '../src/utils'

const wrap = (l: any) => right([[none, l, none], ''])

describe('Parser', () => {
  it('should do shit', () => {
    expect(digits('12901')).toEqual(right(['12901', '']))
    expect(digits('12901asas')).toEqual(right(['12901', 'asas']))
    expect(whitespace(' ')).toEqual(right([' ', '']))
    expect(whitespace('\n')).toEqual(right(['\n', '']))
    expect(whitespace('a')).toEqual(left(['unable to match', 'a']))

    expect(delimited(whitespaces0, digits, whitespaces0)(' 20 ')).toEqual(
      right(['20', '']),
    )
    expect(delimited(whitespaces0, digits, whitespaces0)(' 2 0 ')).toEqual(
      right(['2', '0 ']),
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
      wrap([
        Expr.PropertyMatch({
          name: 'name',
          exprs: [Expr.AnyString(), Expr.Truthy()],
        }),
        Expr.PropertyMatch({ name: 'age', exprs: [Expr.AnyNumber()] }),
      ]),
    )
  })

  it('literals', () => {
    // unsigned numbers
    expect(parser(/ 0.105 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(0.105))]),
    )
    expect(parser(/ 9 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(9))]),
    )
    expect(parser(/ 23 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(23))]),
    )

    // signed numbers
    expect(parser(/ +23.025 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(23.025))]),
    )
    expect(parser(/ -23.025 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(-23.025))]),
    )
    expect(parser(/ +23 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(23))]),
    )
    expect(parser(/ -23 /.source)).toEqual(
      wrap([Expr.Literal(Literal.Number(-23))]),
    )

    // boolean
    expect(parser(/ true /.source)).toEqual(
      wrap([Expr.Literal(Literal.Boolean(true))]),
    )
    expect(parser(/ false /.source)).toEqual(
      wrap([Expr.Literal(Literal.Boolean(false))]),
    )
  })
})
