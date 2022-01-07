import { constant, pipe } from 'fp-ts/function'
import { chain, orElse, right } from 'fp-ts/lib/Either'
import {
  delimited,
  many1,
  mapTo,
  optional,
  or,
  Parser,
  ParserResult,
  symbol,
  tuple3,
} from './utils'
import { Expr } from '../types'

export const start = mapTo(symbol('^'), constant({ tag: 'Start' } as Expr))
export const end = mapTo(symbol('$'), constant({ tag: 'End' } as Expr))
export const anyItem = mapTo(symbol('.'), constant({ tag: 'AnyItem' } as Expr))
export const nextItem = mapTo(
  symbol(','),
  constant({ tag: 'NextItem' } as Expr)
)
export const anyString = mapTo(
  symbol('\\s'),
  constant({ tag: 'AnyString' } as Expr)
)
export const anyNumber = mapTo(
  symbol('\\n'),
  constant({ tag: 'AnyNumber' } as Expr)
)
export const anyBool = mapTo(
  symbol('\\b'),
  constant({ tag: 'AnyBool' } as Expr)
)
export const truthy = mapTo(symbol('\\T'), constant({ tag: 'Truthy' } as Expr))
export const falsey = mapTo(symbol('\\F'), constant({ tag: 'Falsey' } as Expr))

export const wrapQuantifiers: (e: ParserResult<Expr>) => ParserResult<Expr> =
  chain(([expr, input]) =>
    pipe(
      input,
      or([
        mapTo(symbol('*'), (_) => ({ tag: 'ZeroOrMore', expr } as Expr)),
        mapTo(symbol('+'), (_) => ({ tag: 'OneOrMore', expr } as Expr)),
        mapTo(symbol('?'), (_) => ({ tag: 'Optional', expr } as Expr)),
      ]),
      orElse(() => right([expr, input]))
    )
  )

export const expressionP: Parser<Expr> = (input: string) =>
  pipe(
    input,
    or([
      mapTo(
        delimited(symbol('('), many1(expressionP), symbol(')')),
        (exprs) => ({ tag: 'Group', exprs } as Expr)
      ),
      nextItem,
      anyItem,
      anyString,
      anyNumber,
      anyBool,
      truthy,
      falsey,
    ]),
    wrapQuantifiers
  )

export const parser = tuple3(optional(start), many1(expressionP), optional(end))

/*

{3,6} => 3 to 6 instances
(> 5) => number greater than
(< 5) => number less than
[name x] => apply x on property `name`
| => or
/x/ => match regular expression (string values in list)

*/
