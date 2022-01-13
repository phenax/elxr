import { flow, pipe } from 'fp-ts/function'
import { chain, left, orElse, right } from 'fp-ts/lib/Either'
import {
  delimited,
  many0,
  many1,
  mapTo,
  oneOf,
  optional,
  or,
  pair,
  Parser,
  ParserResult,
  prefixed,
  satifyChar,
  suffixed,
  symbol,
  tuple3,
  whitespaces0,
} from './utils'
import { Expr, ListExpr } from '../types'

const start = mapTo(symbol('^'), _ => Expr.Start())
const end = mapTo(symbol('$'), _ => Expr.End())
const anyItem = mapTo(symbol('.'), _ => Expr.AnyItem())
const nextItem = mapTo(symbol(','), _ => Expr.NextItem())
const anyString = mapTo(symbol('\\s'), _ => Expr.AnyString())
const anyNumber = mapTo(symbol('\\n'), _ => Expr.AnyNumber())
const anyBool = mapTo(symbol('\\b'), _ => Expr.AnyBool())
const truthy = mapTo(symbol('\\T'), _ => Expr.Truthy())
const falsey = mapTo(symbol('\\F'), _ => Expr.Falsey())

const wrapQuantifiers: (e: ParserResult<Expr>) => ParserResult<Expr> = chain(
  ([expr, input]) =>
    pipe(
      input,
      or([
        mapTo(symbol('*'), _ => Expr.ZeroOrMore({ expr })),
        mapTo(symbol('+'), _ => Expr.OneOrMore({ expr })),
        mapTo(symbol('?'), _ => Expr.Optional({ expr })),
      ]),
      orElse(_ => right([expr, input])),
    ),
)

const wrapAlt: (e: ParserResult<Expr>) => ParserResult<Expr> = chain(
  ([expr, input]) =>
    pipe(
      input,
      mapTo(prefixed(symbol('|'), many1(expressionP)), rest =>
        Expr.Or({ left: expr, right: rest }),
      ),
      orElse(_ => right([expr, input])),
    ),
)

const propRegex = /^[A-Za-z0-9_-]$/

export const propertyName: Parser<string> = pipe(
  satifyChar(c => propRegex.test(c)),
  many1,
  p => mapTo(p, xs => xs.join('')),
  p => suffixed(p, whitespaces0),
)

const objectProperty = (input: string) =>
  pipe(
    input,
    mapTo(
      delimited(
        symbol('['),
        pair(propertyName, many0(expressionP)),
        symbol(']'),
      ),
      ([name, exprs]) => Expr.PropertyMatch({ name, exprs }),
    ),
  )

const expressionP: Parser<Expr> = (input: string) =>
  pipe(
    input,
    or([
      mapTo(delimited(symbol('('), many1(expressionP), symbol(')')), exprs =>
        Expr.Group({ exprs }),
      ),
      objectProperty,
      nextItem,
      anyItem,
      anyString,
      anyNumber,
      anyBool,
      truthy,
      falsey,
    ]),
    wrapQuantifiers,
    wrapAlt,
  )

export const parser: Parser<ListExpr> = tuple3(
  optional(start),
  many1(expressionP),
  optional(end),
)

/*

{3,6} => 3 to 6 instances
(> 5) => number greater than
(< 5) => number less than
[name x] => apply x on property `name`
/x/ => match regular expression (string values in list)

*/
