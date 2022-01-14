import { left, right } from 'fp-ts/Either'
import {
  digits,
  whitespace,
  whitespaces0,
  delimited,
  not,
  symbol,
  satisfyChar,
  matchChar,
  manyTill,
  pair,
} from '../src/parser/utils'
import { parser } from '../src/parser'
import { none, some } from 'fp-ts/Option'
import { Expr, Literal } from '../src/types'
import {jlog} from '../src/utils'

const wrap = (e: Expr) => right([[none, e, none], ''])
const grouped = (l: Expr[]) => wrap(Expr.Group({ exprs: l }))
const groupedAlt = (l: Expr[]) => wrap(Expr.Or({ exprs: l }))

describe('Parser', () => {
  it('should do shit', () => {
    // jlog(parser(/ -2.05|\n2|true|\s|\T /.source))
    //const p = pair(symbol('a'), symbol('b'))
    //jlog(manyTill(p, matchChar('!'))('ab ab ab ab! nice nice'))
  })

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

  it('should compount expressions', () => {
    expect(parser(/^ .\s(\n\b)  \T $/.source)).toEqual(
      right([
        [
          some(Expr.Start()),
          Expr.Group({
            exprs: [
              Expr.AnyItem(),
              Expr.AnyString(),
              Expr.Group({ exprs: [Expr.AnyNumber(), Expr.AnyBool()] }),
              Expr.Truthy(),
            ],
          }),
          some(Expr.End()),
        ],
        '',
      ]),
    )

    expect(parser(/^ \s* \T? \n+ $/.source)).toEqual(
      right([
        [
          some(Expr.Start()),
          Expr.Group({
            exprs: [
              Expr.ZeroOrMore({ expr: Expr.AnyString() }),
              Expr.Optional({ expr: Expr.Truthy() }),
              Expr.OneOrMore({ expr: Expr.AnyNumber() }),
            ],
          }),
          some(Expr.End()),
        ],
        '',
      ]),
    )
  })

  it('should or expressions', () => {
    expect(parser(/ \s|\b\T|\n /.source)).toEqual(
      groupedAlt([
        Expr.AnyString(),
        Expr.Group({ exprs: [Expr.AnyBool(), Expr.Truthy()] }),
        Expr.AnyNumber(),
      ]),
    )
    expect(parser(/ ((\s|\b\T)|\n) /.source)).toEqual(
      groupedAlt([
        Expr.Or({
          exprs: [
            Expr.AnyString(),
            Expr.Group({ exprs: [Expr.AnyBool(), Expr.Truthy()] }),
          ],
        }),
        Expr.AnyNumber(),
      ]),
    )
  })

  it('object proprtyu', () => {
    expect(parser(/ [name \s\T] [age \n] /.source)).toEqual(
      grouped([
        Expr.PropertyMatch({
          name: 'name',
          expr: Expr.Group({ exprs: [Expr.AnyString(), Expr.Truthy()] }),
        }),
        Expr.PropertyMatch({
          name: 'age',
          expr: Expr.AnyNumber(),
        }),
      ]),
    )
  })

  it('literals', () => {
    // unsigned numbers
    expect(parser(/ 0.105 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(0.105))),
    )
    expect(parser(/ 9 /.source)).toEqual(wrap(Expr.Literal(Literal.Number(9))))
    expect(parser(/ 23 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(23))),
    )

    // signed numbers
    expect(parser(/ 23.025 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(23.025))),
    )
    expect(parser(/ -23.025 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(-23.025))),
    )
    expect(parser(/ 23 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(23))),
    )
    expect(parser(/ -23 /.source)).toEqual(
      wrap(Expr.Literal(Literal.Number(-23))),
    )

    // boolean
    expect(parser(/ true /.source)).toEqual(
      wrap(Expr.Literal(Literal.Boolean(true))),
    )
    expect(parser(/ false /.source)).toEqual(
      wrap(Expr.Literal(Literal.Boolean(false))),
    )

    // String literal
    expect(parser(/ "foobar" /.source)).toEqual(
      wrap(Expr.Literal(Literal.String('foobar'))),
    )
    expect(parser(/ "\nwowksadj\n\t wjksdlsd'' !@#%^(&^%$) " /.source)).toEqual(
      wrap(Expr.Literal(Literal.String('\\nwowksadj\\n\\t wjksdlsd\'\' !@#%^(&^%$) '))),
    )
  })

  it('sequence of values', () => {
    expect(parser(/true, \s\T, \n/.source)).toEqual(
      wrap(
        Expr.Sequence({
          exprs: [
            Expr.Literal(Literal.Boolean(true)),
            Expr.Group({ exprs: [Expr.AnyString(), Expr.Truthy()] }),
            Expr.AnyNumber(),
          ],
        }),
      ),
    )
  })
})
