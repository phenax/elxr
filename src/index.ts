import { flow, identity, pipe } from 'fp-ts/function'
import { Either, left, right, map, chain, mapLeft, fold, orElse } from 'fp-ts/Either'

type char = string

type ParserResult<T> = [T, string]
type ParserError = [string, string]
type Parser<T> = (input: string) => Either<ParserError, ParserResult<T>>

export const many0 = <T>(parser: Parser<T>): Parser<Array<T>> => flow(
  parser,
  chain(([a, nextInput]) =>
    pipe(
      nextInput,
      many0(parser),
      map(([ls, inp]): ParserResult<T[]> => [[a, ...ls], inp]),
    )
  ),
  orElse(([_, inp]) => right([[] as T[], inp]))
)

export const many1 = <T>(parser: Parser<T>): Parser<Array<T>> => flow(
  many0(parser),
  chain(([res, inp]) =>
    res.length > 0 ? right([res, inp]) : left([`many1 failed to parse at ${inp}`, inp]))
)

export const satify_char = (f: (c: char) => boolean): Parser<char> => (input: string) => {
  const c = input.charAt(0)
  if (f(c)) return right([c, input.slice(1)])
  return left([`Expected to satisfy ${f}, got "${c}"`, input])
};

export const digit = satify_char(c => /^[0-9]$/g.test(c))

export const integer: Parser<number> = flow(
  many1(digit),
  map(([ds, input]) => [parseInt(ds.join(''), 10), input])
)

export const or = <T>(parsers: Parser<T>[]): Parser<T> => {
  const ppp = ([p, ...ps]: Parser<T>[]) => flow(
    p,
    orElse(([_, inp]) => or(ps)(inp))
  )

  return parsers.length > 0 ? ppp(parsers) : (inp: string) => left(['unable to match', inp])
}

export const space = satify_char(c => c === ' ')
export const newline = satify_char(c => c === '\n')
export const tab = satify_char(c => c === '\t')

export const whitespace = or([space, newline, tab])

