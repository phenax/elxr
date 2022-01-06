import { flow, pipe } from 'fp-ts/function'
import { Either, left, right, map, chain, orElse, fold } from 'fp-ts/Either'
import { none, some, Option } from 'fp-ts/lib/Option'

export type char = string

export type ParserResult<T> = [T, string]
export type ParserError = [string, string]
export type Parser<T> = (input: string) => Either<ParserError, ParserResult<T>>

export const constP =
  <T>(v: T): Parser<T> =>
  (inp: string) =>
    right([v, inp])

export const many0 = <T>(parser: Parser<T>): Parser<Array<T>> =>
  flow(
    parser,
    chain(([a, nextInput]) =>
      pipe(
        nextInput,
        many0(parser),
        map(([ls, inp]): ParserResult<T[]> => [[a, ...ls], inp])
      )
    ),
    orElse(([_, inp]) => right([[] as T[], inp]))
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

export const prefixed = <T>(a: Parser<any>, b: Parser<T>): Parser<T> =>
  flow(
    a,
    chain(([_, inp]) => b(inp))
  )

export const suffixed = <T>(a: Parser<T>, b: Parser<any>): Parser<T> =>
  flow(
    a,
    chain(([out, inp]) =>
      pipe(
        inp,
        b,
        chain(([_, inp2]) => right([out, inp2]))
      )
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
  map(([ds, input]) => [parseInt(ds.join(''), 10), input])
)

export const or = <T>(parsers: Parser<T>[]): Parser<T> => {
  const ppp = ([p, ...ps]: Parser<T>[]) =>
    flow(
      p,
      orElse(([_, inp]) => or(ps)(inp))
    )

  return parsers.length > 0
    ? ppp(parsers)
    : (inp: string) => left(['unable to match', inp])
}

export const matchChar = (ch: char): Parser<char> => satifyChar((c) => c === ch)

export const space = matchChar(' ')
export const newline = matchChar('\n')
export const tab = matchChar('\t')

export const whitespace = or([space, newline, tab])
export const whitespaces0 = many0(whitespace)

export const matchString = (s: string): Parser<string> =>
  s === ''
    ? constP('')
    : flow(
        matchChar(s.charAt(0)),
        chain(([c, inp]) =>
          pipe(
            inp,
            matchString(s.slice(1)),
            map(([s, inp]) => [c + s, inp])
          )
        )
      )

export const symbol = (s: string): Parser<string> =>
  delimited(whitespaces0, matchString(s), whitespaces0)

export const mapTo = <I, R>(p: Parser<I>, f: (p: I) => R): Parser<R> =>
  flow(
    p,
    map(([v, inp]) => [f(v), inp])
  )

export const andThen = <I, R>(f: (p: I) => Parser<R>) => (p: Parser<I>): Parser<R> =>
  flow(
    p,
    chain(([v, inp]) => f(v)(inp)),
  )

export const optional = <T>(p: Parser<T>): Parser<Option<T>> =>
  flow(
    p,
    fold(
      ([_, inp]) => right([none, inp]),
      ([v, inp]) => right([some(v), inp])
    )
  )

export const pair = <A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> => pipe(
  a,
  andThen(ra => mapTo(b, rb => [ra, rb]))
)

