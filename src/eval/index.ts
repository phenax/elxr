import { pipe } from 'fp-ts/function'
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

const checkExpr = <T>(
  expr: Expr,
  item: T,
  list: T[],
  index: number,
): MatchGroupIndexed<T>[] => {
  return pipe(
    expr,
    match<MatchGroupIndexed<any>[], Expr>({
      AnyItem: _ => [group(item, index)],
      AnyNumber: _ => (typeof item === 'number' ? [group(item, index)] : []),
      AnyString: _ => (typeof item === 'string' ? [group(item, index)] : []),
      AnyBool: _ => (typeof item === 'boolean' ? [group(item, index)] : []),
      Truthy: _ => (!!item ? [group(item, index)] : []),
      Falsey: _ => (!item ? [group(item, index)] : []),

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
        )
      },

      PropertyMatch: ({ name, exprs }) =>
        pipe(
          Object.prototype.hasOwnProperty.call(item, name)
            ? checkExpr(Expr.Group({ exprs }), item[name], list, index)
            : [],
          res => (res.length > 0 ? [group(item, index)] : []), // FIXME: doesn't allow nested matching
        ),

      OneOrMore: ({ expr }) => {
        // TODO: Nested quantified expression
        const matches = pipe(
          list,
          takeLeftWhile(a => checkExpr(expr, a, list, index).length > 0),
        )
        return matches.length > 0 ? [group(matches, index)] : []
      },

      _: _ => [],
    }),
  )
}

// :: ListExpr -> [a] -> [{ groups: [T] }]
export const matchAll = <T>(
  [startO, exprs, endO]: ListExpr,
  list: T[],
): MatchGroupResult => {
  const check = (index: number, ls: T[], expr: Expr): MatchGroupIndexed[] => {
    if (ls.length === 0) return []

    const [item, ...rest] = ls

    const next =
      (i: number = 1) =>
      (curMatch: MatchGroupIndexed[]) =>
        [...curMatch, ...check(index + i, ls.slice(i), expr)]

    return pipe(
      expr,
      match<MatchGroupIndexed<any>[], Expr>({
        OneOrMore: ({ expr }) => {
          return pipe(
            checkExpr(expr, item, ls, index),
            matches => next(1)(matches), // matches.length || 
          )
        },

        _: _ => pipe(checkExpr(expr, item, ls, index), next()),
      }),
    )
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
