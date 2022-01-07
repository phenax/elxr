import { constant, flow, identity, pipe } from 'fp-ts/function'
import {
  andThen,
  delimited,
  digit,
  integer,
  many1,
  mapTo,
  matchChar,
  optional,
  or,
  pair,
  Parser,
  symbol,
  tuple3,
} from './parser'

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
// export const optional = mapTo(symbol('?'), constant({ tag: 'Optional' } as Expr))
// export const zeroOrMore = mapTo(symbol('*'), constant({ tag: 'ZeroOrMore' } as Expr))
// export const oneOrMore = mapTo(symbol('+'), constant({ tag: 'OneOrMore' } as Expr))

type Expr =
  | { tag: 'Start' }
  | { tag: 'End' }
  | { tag: 'Optional' }
  | { tag: 'OneOrMore' }
  | { tag: 'ZeroOrMore' }
  | { tag: 'NextItem' }
  | { tag: 'AnyItem' }
  | { tag: 'Or' }
  | { tag: 'AnyString' }
  | { tag: 'AnyNumber' }
  | { tag: 'AnyBool' }
  | { tag: 'Truthy' }
  | { tag: 'Falsey' }
  | { tag: 'Group'; exprs: Expr[] }

export const expressionP: Parser<Expr> = (input: string) =>
  pipe(
    input,
    or([
      mapTo(
        delimited(symbol('('), many1(expressionP), symbol(')')),
        (exprs) => ({ tag: 'Group', exprs })
      ),
      nextItem,
      anyItem,
      anyString,
      anyNumber,
      anyBool,
      truthy,
      falsey,
    ])
  )

export const parser = tuple3(optional(start), many1(expressionP), optional(end))

/*

^ $ => start and end of list
? => optional
. => any item
* => 0 or more instances
+ => 1 or more instances
{3,6} => 3 to 6 instances
\s => string
\n => number
\b => boolean
\T => truthy
\F => falsey
(> 5) => number greater than
(< 5) => number less than
, => followed by
[name x] => apply x on property `name`
| => or
/x/ => match regular expression (string values in list)

*/
