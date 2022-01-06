import { constant, flow, identity, pipe } from 'fp-ts/function'
import { andThen, delimited, mapTo, optional, pair, symbol } from './parser'

export const start = mapTo(symbol('^'), constant({ tag: 'Start' } as Expr))
export const end = mapTo(symbol('$'), constant({ tag: 'End' } as Expr))
export const anyItem = mapTo(symbol(','), constant({ tag: 'AnyItem' } as Expr))
export const nextItem = mapTo(
  symbol(','),
  constant({ tag: 'NextItem' } as Expr)
)
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
  | { tag: 'String' }
  | { tag: 'Number' }
  | { tag: 'Bool' }
  | { tag: 'Truthy' }
  | { tag: 'Falsey' }

export const expressionP = symbol('fuck')

export const parser = pair(
  pair(
    optional(start),
    expressionP,
  ),
  optional(end),
)

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
