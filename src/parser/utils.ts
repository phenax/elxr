import { flow, pipe } from 'fp-ts/function'
import * as Either from 'fp-ts/Either'
import * as Option from 'fp-ts/Option'
import { fst, mapFst, mapSnd, snd } from 'fp-ts/Tuple'
import { eq } from '../utils'
import { prepend } from 'fp-ts/Array'

export type char = string

export type ParserState<T> = [T, string]
export type ParserError = [string, string]
export type ParserResult<T> = Either.Either<ParserError, ParserState<T>>
export type Parser<T> = (input: string) => ParserResult<T>

export const constP =
  <T>(v: T): Parser<T> =>
  (inp: string) =>
    Either.right([v, inp])

export const sepBy1 = <T>(sep: Parser<any>, parser: Parser<T>): Parser<T[]> =>
  flow(
    parser,
    Either.chain(([val, nextInput]) =>
      pipe(
        nextInput,
        many0(prefixed(sep, parser)),
        Either.map(mapFst(prepend(val))),
      ),
    ),
  )

export const many0 = <T>(parser: Parser<T>): Parser<Array<T>> =>
  flow(
    parser,
    Either.chain(([a, nextInput]) =>
      pipe(nextInput, many0(parser), Either.map(mapFst(prepend(a)))),
    ),
    Either.orElse(
      flow(
        mapFst(_ => [] as T[]),
        Either.right,
      ),
    ),
  )

export const many1 = <T>(parser: Parser<T>): Parser<Array<T>> =>
  recoverInput(
    flow(
      many0(parser),
      Either.chain(([res, inp]) =>
        res.length > 0
          ? Either.right([res, inp])
          : Either.left([`many1 failed to parse at '${inp}'`, inp]),
      ),
    ),
  )

const recoverInput =
  <T>(p: Parser<T>): Parser<T> =>
  (input: string) =>
    pipe(
      input,
      p,
      Either.orElseW(
        flow(
          mapSnd(_ => input),
          Either.left,
        ),
      ),
    )

export const prefixed = <T>(a: Parser<any>, b: Parser<T>): Parser<T> =>
  recoverInput(mapTo(pair(a, b), snd))

export const suffixed = <T>(a: Parser<T>, b: Parser<any>): Parser<T> =>
  recoverInput(mapTo(pair(a, b), fst))

export const delimited = <T>(
  p: Parser<any>,
  a: Parser<T>,
  s: Parser<any>,
): Parser<T> => suffixed(prefixed(p, a), s)

export const satifyChar =
  (f: (c: char) => boolean): Parser<char> =>
  (input: string) => {
    const c = input.charAt(0)
    if (f(c)) return Either.right([c, input.slice(1)])
    return Either.left([`Expected to satisfy ${f}, got "${c}"`, input])
  }

export const digit = satifyChar(c => /^[0-9]$/g.test(c))

export const digits: Parser<string> = flow(
  many1(digit),
  Either.map(mapFst(ds => ds.join(''))),
)

export const or = <T>(parsers: Parser<T>[]): Parser<T> => {
  const run = ([p, ...ps]: Parser<T>[]) =>
    flow(
      p,
      Either.orElse(([_, inp]) => or(ps)(inp)),
    )

  return parsers.length > 0
    ? run(parsers)
    : (inp: string) => Either.left(['unable to match', inp])
}

export const matchChar = (ch: char): Parser<char> => satifyChar(eq(ch))

export const matchString =
  (s: string): Parser<string> =>
  (input: string) =>
    input.slice(0, s.length) === s
      ? Either.right([s, input.slice(s.length)])
      : Either.left([`Expected ${s} but got ${input.slice(0, 1)}`, input])

export const oneOf = (xs: string[]): Parser<string> => or(xs.map(matchString))

export const whitespace = oneOf([' ', '\n', '\t'])
export const whitespaces0 = many0(whitespace)

export const symbol = (s: string): Parser<string> =>
  delimited(whitespaces0, matchString(s), whitespaces0)

export const mapTo = <I, R>(p: Parser<I>, f: (p: I) => R): Parser<R> =>
  flow(p, Either.map(mapFst(f)))

export const andThen =
  <I, R>(f: (p: I) => Parser<R>) =>
  (p: Parser<I>): Parser<R> =>
    flow(
      p,
      Either.chain(([v, inp]) => f(v)(inp)),
    )

export const optional = <T>(p: Parser<T>): Parser<Option.Option<T>> =>
  flow(
    recoverInput(p),
    Either.fold(
      flow(
        mapFst(_ => Option.none),
        Either.right,
      ),
      flow(mapFst(Option.some), Either.right),
    ),
  )

export const pair = <A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> =>
  recoverInput(
    pipe(
      a,
      andThen(ra => mapTo(b, rb => [ra, rb])),
    ),
  )

export const tuple3 = <A, B, C>(
  a: Parser<A>,
  b: Parser<B>,
  c: Parser<C>,
): Parser<[A, B, C]> =>
  recoverInput(mapTo(pair(pair(a, b), c), ([[a, b], c]) => [a, b, c]))
