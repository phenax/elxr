import { flow, pipe } from 'fp-ts/function'
import { chain, map as mapE, left, orElse, right } from 'fp-ts/lib/Either'
import {
  delimited,
  digits,
  many0,
  many1,
  mapTo,
  matchChar,
  oneOf,
  optional,
  or,
  pair,
  Parser,
  ParserResult,
  prefixed,
  satifyChar,
  sepBy1,
  suffixed,
  symbol,
  tuple3,
  whitespaces0,
} from './utils'
import { Expr, ListExpr, Literal } from '../types'
import {getOrElse, map} from 'fp-ts/lib/Option'
import {mapFst, snd} from 'fp-ts/lib/Tuple'

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
      ([name, exprs]) => Expr.PropertyMatch({ name, expr: exprsToGroup(exprs) }),
    ),
  )

const unsignedNum: Parser<number> = mapTo(pair(digits, optional(pair(matchChar('.'), digits))), ([int, decimal]) =>
  pipe(
    decimal,
    map(snd),
    getOrElse(() => '0'),
    n => parseFloat(`${int}.${n}`),
  )
)

const numberLiteral: Parser<Literal> = mapTo(
  pair(optional(oneOf(['+', '-'])), unsignedNum),
  ([signO, n]) =>
    pipe(
      signO,
      getOrElse(() => '+'),
      sign => (sign === '-' ? -1 : 1) * n,
      Literal.Number,
    )
  ,
)

const booleanLiteral: Parser<Literal> = mapTo(oneOf(['true', 'false']), b =>
  Literal.Boolean(b === 'true' ? true : false),
)

const literalP: Parser<Literal> = delimited(
  whitespaces0,
  or([booleanLiteral, numberLiteral]),
  whitespaces0,
)

const expressionP: Parser<Expr> = (input: string) => pipe(
  input,
  sepBy1(symbol('|'), groupP),
  mapE(mapFst(exprs => exprs.length === 1 ? exprs[0] : Expr.Or({ exprs }))),
)

const atomP: Parser<Expr> = (input: string) =>
  pipe(
    input,
    or([
      mapTo(delimited(symbol('('), many1(expressionP), symbol(')')), exprsToGroup),
      objectProperty,
      nextItem,
      anyItem,
      anyString,
      anyNumber,
      anyBool,
      truthy,
      falsey,
      mapTo(literalP, Expr.Literal),
    ]),
    wrapQuantifiers,
    //wrapAlt,
  )

const exprsToGroup = (exprs: Expr[]) => exprs.length === 1 ? exprs[0] : Expr.Group({ exprs })
const groupP: Parser<Expr> = mapTo(many1(atomP), exprsToGroup)

export const parser: Parser<ListExpr> = tuple3(
  optional(start),
  expressionP,
  optional(end),
)

/*
{3,6} => 3 to 6 instances
(> 5) => number greater than
(< 5) => number less than
/x/ => match regular expression (string values in list)
*/
