import { pipe } from 'fp-ts/function'
import * as Either from 'fp-ts/Either'
import {
  delimited,
  digits,
  many0,
  many1,
  manyTill,
  mapTo,
  matchChar,
  matchString,
  oneOf,
  optional,
  or,
  pair,
  Parser,
  ParserResult,
  prefixed,
  satisfyChar,
  sepBy1,
  suffixed,
  symbol,
  tuple3,
  whitespaces0,
} from './utils'
import { Expr, index, ListExpr, Literal } from '../types'
import * as Option from 'fp-ts/Option'
import { snd } from 'fp-ts/Tuple'

const start = mapTo(symbol('^'), _ => Expr.Start())
const end = mapTo(symbol('$'), _ => Expr.End())
const anyItem = mapTo(symbol('.'), _ => Expr.AnyItem())
const anyString = mapTo(symbol('\\s'), _ => Expr.AnyString())
const anyNumber = mapTo(symbol('\\n'), _ => Expr.AnyNumber())
const anyBool = mapTo(symbol('\\b'), _ => Expr.AnyBool())
const truthy = mapTo(symbol('\\T'), _ => Expr.Truthy())
const falsey = mapTo(symbol('\\F'), _ => Expr.Falsey())

const parseQuantifier = (s: Option.Option<string>, def: index): index =>
  pipe(
    s,
    Option.map(s => parseInt(s, 10)),
    Option.getOrElse(() => def),
  )

const wrapQuantifiers: (e: ParserResult<Expr>) => ParserResult<Expr> =
  Either.chain(([expr, input]) =>
    pipe(
      input,
      or([
        mapTo(symbol('*'), _ => Expr.ZeroOrMore({ expr })),
        mapTo(symbol('+'), _ => Expr.OneOrMore({ expr })),
        mapTo(symbol('?'), _ => Expr.Optional({ expr })),
        mapTo(
          pair(
            prefixed(symbol('{'), optional(digits)),
            delimited(symbol(','), optional(digits), symbol('}')),
          ),
          ([min, max]) =>
            Expr.MinMax({
              expr,
              min: parseQuantifier(min, 0),
              max: parseQuantifier(max, Infinity),
            }),
        ),
      ]),
      Either.orElse(_ => Either.right([expr, input])),
    ),
  )

const propRegex = /^[A-Za-z0-9_-]$/

export const propertyName: Parser<string> = pipe(
  satisfyChar(c => propRegex.test(c)),
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
      ([name, exprs]) =>
        Expr.PropertyMatch({ name, expr: exprsToGroup(exprs) }),
    ),
  )

const unsignedNum: Parser<number> = mapTo(
  pair(digits, optional(pair(matchChar('.'), digits))),
  ([int, decimal]) =>
    pipe(
      decimal,
      Option.map(snd),
      Option.getOrElse(() => '0'),
      n => parseFloat(`${int}.${n}`),
    ),
)

const numberLiteral: Parser<Literal> = mapTo(
  pair(optional(matchChar('-')), unsignedNum),
  ([signO, n]) =>
    pipe(
      signO,
      negative => (Option.isSome(negative) ? -1 : 1) * n,
      Literal.Number,
    ),
)

const booleanLiteral: Parser<Literal> = mapTo(oneOf(['true', 'false']), b =>
  Literal.Boolean(b === 'true' ? true : false),
)

const stringDelimiter = matchChar('"')

const stringLiteral: Parser<Literal> = mapTo(
  prefixed(
    stringDelimiter,
    manyTill(
      satisfyChar(_ => true),
      stringDelimiter,
    ),
  ),
  s => Literal.String(s.join('')),
)

const literalP: Parser<Literal> = delimited(
  whitespaces0,
  or([booleanLiteral, numberLiteral, stringLiteral]),
  whitespaces0,
)

const infixOp =
  (op: Parser<any>): Parser<Expr[]> =>
  (input: string) =>
    pipe(
      input,
      sepBy1(op, groupP),
      Either.chain(([exprs, nextInput]) =>
        exprs.length === 1
          ? Either.left(['Infix operator parsing error', input])
          : Either.right([exprs, nextInput]),
      ),
    )

const altP: Parser<Expr> = mapTo(infixOp(symbol('|')), exprs =>
  Expr.Or({ exprs }),
)

const sequenceP: Parser<Expr> = mapTo(infixOp(symbol(',')), exprs =>
  Expr.Sequence({ exprs }),
)

const expressionP: Parser<Expr> = (input: string) =>
  or([altP, sequenceP, groupP])(input)

const atomP: Parser<Expr> = (input: string) =>
  pipe(
    input,
    or([
      mapTo(
        delimited(symbol('('), many1(expressionP), symbol(')')),
        exprsToGroup,
      ),
      objectProperty,
      anyItem,
      anyString,
      anyNumber,
      anyBool,
      truthy,
      falsey,
      mapTo(literalP, Expr.Literal),
    ]),
    wrapQuantifiers,
  )

const exprsToGroup = (exprs: Expr[]) =>
  exprs.length === 1 ? exprs[0] : Expr.Group({ exprs })
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
