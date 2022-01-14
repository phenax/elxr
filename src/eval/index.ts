import { identity, pipe } from 'fp-ts/function'
import { filter, takeLeftWhile, zip, zipWith } from 'fp-ts/lib/Array'
import {
  chain,
  getOrElseW,
  isSome,
  map,
  none,
  Option,
  some,
} from 'fp-ts/lib/Option'
import { Expr, ListExpr, Literal } from '../types'
import { jlog, match } from '../utils'

export interface MatchGroupIndexed<T = any> {
  value: T
  index: number
}

export interface MatchGroupResult {
  groups: MatchGroupIndexed[]
}

const group = <T>(value: T, index: number): MatchGroupIndexed<T> => ({
  value,
  index,
})

type index = number

const accumulateSkip = () => {
  const skipIndexes = [] as index[]
  return {
    localSkip:
      (i: index) =>
      <T>(x: T): T => (skipIndexes.push(i), x),
    getSkips: () => skipIndexes,
  }
}

const checkExpr = <T>(
  expr: Expr,
  item: T,
  list: T[],
  index: number,
  skip: (
    n: index,
  ) => (m: MatchGroupIndexed<any>[]) => MatchGroupIndexed<any>[] = _ =>
    identity,
): MatchGroupIndexed<any>[] => {
  return pipe(
    expr,
    match<MatchGroupIndexed<any>[], Expr>({
      AnyItem: _ => pipe([group(item, index)], skip(1)),
      AnyNumber: _ =>
        pipe(typeof item === 'number' ? [group(item, index)] : [], skip(1)),
      AnyString: _ =>
        pipe(typeof item === 'string' ? [group(item, index)] : [], skip(1)),
      AnyBool: _ =>
        pipe(typeof item === 'boolean' ? [group(item, index)] : [], skip(1)),
      Truthy: _ => pipe(!!item ? [group(item, index)] : [], skip(1)),
      Falsey: _ => pipe(!item ? [group(item, index)] : [], skip(1)),
      Literal: literal =>
        pipe(
          (literal.value as any) === item ? [group(item, index)] : [],
          skip(1),
        ),

      Group: ({ exprs }) => {
        const [head, ...tail] = exprs
        const { getSkips, localSkip } = accumulateSkip()
        const matches = tail.reduce(
          (acc, exp) =>
            pipe(
              acc,
              chain(ac =>
                pipe(
                  checkExpr(exp, item, list, index, localSkip),
                  zip(ac),
                  z => z.map(([res, _cur]) => res),
                  z => (z.length === 0 ? none : some(z)),
                ),
              ),
            ),
          some(checkExpr(head, item, list, index, localSkip)),
        )
        return pipe(
          matches,
          getOrElseW(() => []),
          skip(Math.max(...getSkips()) || 1),
        )
      },

      Or: ({ exprs }) => {
        const match = exprs.find(
          expr => checkExpr(expr, item, list, index).length > 0,
        )
        return pipe(match ? [group(item, index)] : [], skip(1))
      },

      PropertyMatch: ({ name, expr }) =>
        pipe(
          Object.prototype.hasOwnProperty.call(item ?? {}, name)
            ? checkExpr(expr, item[name], list, index)
            : [],
          res => (res.length > 0 ? [group(item, index)] : []), // FIXME: doesn't allow nested matching
          skip(1),
        ),

      OneOrMore: ({ expr }) => {
        // TODO: Nested quantified expression
        const matches = pipe(
          list,
          takeLeftWhile(a => checkExpr(expr, a, list, index).length > 0),
        )
        return pipe(
          matches.length > 0 ? [group(matches, index)] : [],
          skip(matches.length || 1),
        )
      },

      Sequence: ({ exprs }) => {
        const { getSkips, localSkip } = accumulateSkip()
        const getGroups = () => {
          if (exprs.length > list.length) return []
          const indexed = <T>(ls: T[]): Array<[number, T]> =>
            ls.map((x, i) => [i, x])
          const result = pipe(
            zipWith(exprs, indexed(list), (expr, [i, val]) =>
              checkExpr(expr, val, list.slice(i), index + i, localSkip),
            ),
            filter(matches => !!matches.length),
          )
          if (result.length !== exprs.length) return []

          return [group(result, index)]
        }

        const groups = getGroups()
        const skips = Math.max(
          1,
          getSkips().reduce((a, b) => a + b, -1),
        )
        return pipe(groups, skip(skips))
      },

      _: _ => {
        throw new Error(`TODO: ${expr.tag} not implemented for match`)
      },
    }),
  )
}

export const matchAll = <T>(
  [startO, expr, endO]: ListExpr,
  list: T[],
): MatchGroupResult => {
  const check = (index: number, ls: T[], expr: Expr): MatchGroupIndexed[] => {
    if (ls.length === 0) return []

    const [item] = ls

    const next =
      (i: number = 1) =>
      (curMatch: MatchGroupIndexed[]) =>
        [...curMatch, ...check(index + i, ls.slice(i), expr)]

    return checkExpr(expr, item, ls, index, next)
  }

  return {
    groups: check(0, list, expr),
  }
}
