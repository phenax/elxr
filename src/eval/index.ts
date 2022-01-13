import { identity, pipe } from 'fp-ts/function'
import { takeLeftWhile, zip } from 'fp-ts/lib/Array'
import {
  chain,
  getOrElseW,
  isSome,
  map,
  none,
  Option,
  some,
} from 'fp-ts/lib/Option'
import { Expr, ListExpr } from '../types'
import { match } from '../utils'

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

const checkExpr = <T>(
  expr: Expr,
  item: T,
  list: T[],
  index: number,
  skip: (n: index) => (m: MatchGroupIndexed<T | T[]>[]) => typeof m = _ =>
    identity,
): MatchGroupIndexed<T>[] => {
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

      Group: ({ exprs }) => {
        const [head, ...tail] = exprs
        const matches = tail.reduce(
          (acc, exp) =>
            pipe(
              acc,
              chain(ac =>
                pipe(
                  checkExpr(exp, item, list, index),
                  zip(ac),
                  z => z.map(([res, _cur]) => res),
                  z => (z.length === 0 ? none : some(z)),
                ),
              ),
            ),
          some(checkExpr(head, item, list, index)),
        )
        return pipe(
          matches,
          getOrElseW(() => []),
          skip(1),
        )
      },

      PropertyMatch: ({ name, exprs }) =>
        pipe(
          Object.prototype.hasOwnProperty.call(item, name)
            ? checkExpr(Expr.Group({ exprs }), item[name], list, index)
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
        return pipe(matches.length > 0 ? [group(matches, index)] : [], skip(1))
      },

      _: _ => [],
    }),
  )
}

export const matchAll = <T>(
  [startO, exprs, endO]: ListExpr,
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

  const expr = Expr.Group({ exprs })

  return {
    groups: check(0, list, expr),
  }
}

export const find = <T>([startO, exprs, endO]: ListExpr, list: T[]): any => {
  const check =
    (expr: Expr) =>
    <T>(x: T, i: number, ls: T[]): boolean => {
      return pipe(
        expr,
        match<boolean, Expr>({
          AnyItem: _ => true,
          AnyNumber: _ => typeof x === 'number',
          AnyString: _ => typeof x === 'string',
          AnyBool: _ => typeof x === 'boolean',
          Truthy: _ => !!x,
          Falsey: _ => !x,
          Group: ({ exprs }) => exprs.every(e => check(e)(x, i, ls)),
          PropertyMatch: ({ name, exprs }) =>
            name in x && exprs.every(e => check(e)(x[name], i, ls)),
          OneOrMore: ({ expr }) => {
            // TODO: Nested quantified expression
            const x = pipe(
              list.slice(i),
              takeLeftWhile(x => check(expr)(x, i, list)),
            )
            return true
          },
          _: _ => false,
        }),
      )
    }

  const cs = exprs.map(check)

  return list.filter((x, i, ls) => cs.every(c => c(x, i, ls)))
}
