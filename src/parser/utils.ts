import { constant, flow, pipe } from 'fp-ts/function'
import {
  Either,
  left,
  right,
  map,
  chain,
  orElse,
  fold,
  orElseW,
} from 'fp-ts/Either'
import { none, some, Option } from 'fp-ts/Option'
import { mapFst, mapSnd, snd } from 'fp-ts/Tuple'
import { eq } from '../utils'

export type char = string

export type ParserState<T> = [T, string]
export type ParserError = [string, string]
export type ParserResult<T> = Either<ParserError, ParserState<T>>
export type Parser<T> = (input: string) => ParserResult<T>

export const constP =
  <T>(v: T): Parser<T> =>
  (inp: string) =>
    right([v, inp])

export const many0 = <T>(parser: Parser<T>): Parser<Array<T>> =>
  flow(
    parser,
    chain(([a, nextInput]) =>
      pipe(nextInput, many0(parser), map(mapFst((ls) => [a, ...ls])))
    ),
    orElse(
      flow(
        mapFst((_) => [] as T[]),
        right
      )
    )
  )

export const many1 = <T>(parser: Parser<T>): Parser<Array<T>> =>
  flow(
    many0(parser),
    chain(([res, inp]) =>
      res.length > 0
        ? right([res, inp])
        : left([`many1 failed to parse at ${inp}`, inp])
    )
  )

const recoverInput =
  <T>(p: Parser<T>): Parser<T> =>
  (input: string) =>
    pipe(
      input,
      p,
      orElseW(
        flow(
          mapSnd((_) => input),
          left
        )
      )
    )

export const prefixed = <T>(a: Parser<any>, b: Parser<T>): Parser<T> =>
  recoverInput(flow(a, chain(flow(snd, b))))

export const suffixed = <T>(a: Parser<T>, b: Parser<any>): Parser<T> =>
  recoverInput(
    flow(
      a,
      chain(([out, inp]) => pipe(inp, b, map(mapFst((_) => out))))
    )
  )

export const delimited = <T>(
  p: Parser<any>,
  a: Parser<T>,
  s: Parser<any>
): Parser<T> => suffixed(prefixed(p, a), s)

export const satifyChar =
  (f: (c: char) => boolean): Parser<char> =>
  (input: string) => {
    const c = input.charAt(0)
    if (f(c)) return right([c, input.slice(1)])
    return left([`Expected to satisfy ${f}, got "${c}"`, input])
  }

export const digit = satifyChar((c) => /^[0-9]$/g.test(c))

export const integer: Parser<number> = flow(
  many1(digit),
  map(mapFst((ds) => parseInt(ds.join(''), 10)))
)

export const or = <T>(parsers: Parser<T>[]): Parser<T> => {
  const run = ([p, ...ps]: Parser<T>[]) =>
    flow(
      p,
      orElse(([_, inp]) => or(ps)(inp))
    )

  return parsers.length > 0
    ? run(parsers)
    : (inp: string) => left(['unable to match', inp])
}

export const matchChar = (ch: char): Parser<char> => satifyChar(eq(ch))

export const space = matchChar(' ')
export const newline = matchChar('\n')
export const tab = matchChar('\t')

export const whitespace = or([space, newline, tab])
export const whitespaces0 = many0(whitespace)

export const matchString =
  (s: string): Parser<string> =>
  (input: string) =>
    input.slice(0, s.length) === s
      ? right([s, input.slice(s.length)])
      : left([`Expected ${s} but got ${input.slice(0, 1)}`, input])

export const symbol = (s: string): Parser<string> =>
  delimited(whitespaces0, matchString(s), whitespaces0)

export const mapTo = <I, R>(p: Parser<I>, f: (p: I) => R): Parser<R> =>
  flow(p, map(mapFst(f)))

export const andThen =
  <I, R>(f: (p: I) => Parser<R>) =>
  (p: Parser<I>): Parser<R> =>
    flow(
      p,
      chain(([v, inp]) => f(v)(inp))
    )

export const optional = <T>(p: Parser<T>): Parser<Option<T>> =>
  flow(
    p,
    fold(
      flow(
        mapFst((_) => none),
        right
      ),
      flow(mapFst(some), right)
    )
  )

export const pair = <A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> =>
  pipe(
    a,
    andThen((ra) => mapTo(b, (rb) => [ra, rb]))
  )

export const tuple3 = <A, B, C>(
  a: Parser<A>,
  b: Parser<B>,
  c: Parser<C>
): Parser<[A, B, C]> => mapTo(pair(pair(a, b), c), ([[a, b], c]) => [a, b, c])
