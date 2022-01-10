import { pipe } from 'fp-ts/function'
import { takeLeftWhile } from 'fp-ts/lib/Array'
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

// :: ListExpr -> [a] -> [{ groups: [T] }]
export const matchAll = <T>(
  [startO, exprs, endO]: ListExpr,
  list: T[],
): MatchGroupResult => {
  const check = (
    index: number,
    ls: T[],
    expr: Expr,
  ): Option<MatchGroupIndexed[]> => {
    if (ls.length === 0) return some([])

    const [item, ...rest] = ls

    const next =
      (i: number = 1) =>
      (cur: Option<MatchGroupIndexed[]>) =>
        pipe(
          check(index + i, ls.slice(i), expr),
          getOrElseW(() => [] as MatchGroupIndexed[]),
          nextMatch =>
            pipe(
              cur,
              map(curMatch => [...curMatch, ...nextMatch]),
            ),
        )

    return pipe(
      expr,
      match<Option<MatchGroupIndexed<any>[]>, Expr>({
        AnyItem: _ => pipe(some([group(item, index)]), next()),
        AnyNumber: _ =>
          pipe(
            typeof item === 'number' ? some([group(item, index)]) : none,
            next(),
          ),
        AnyString: _ =>
          pipe(
            typeof item === 'string' ? some([group(item, index)]) : none,
            next(),
          ),
        AnyBool: _ =>
          pipe(
            typeof item === 'boolean' ? some([group(item, index)]) : none,
            next(),
          ),
        Truthy: _ => pipe(!!item ? some([group(item, index)]) : none, next()),
        Falsey: _ => pipe(!item ? some([group(item, index)]) : none, next()),

        Group: ({ exprs }) => {
          const matches = exprs.reduce(
            (acc, exp) =>
              pipe(
                acc,
                chain(m =>
                  pipe(
                    check(index, ls, exp),
                    map(ac => [...ac, ...m]),
                  ),
                ),
              ),
            some([] as MatchGroupIndexed<any>[]),
          )
          // console.log(matches, exprs, '---', item)

          return next()(matches)
        },

        PropertyMatch: ({ name, exprs }) =>
          pipe(
            Object.prototype.hasOwnProperty.call(item, name)
              ? check(index, [item[name]], Expr.Group({ exprs }))
              : none,
            next(),
          ),

        OneOrMore: ({ expr }) => {
          //console.log(item)
          // TODO: Nested quantified expression
          const matches = pipe(
            ls,
            takeLeftWhile(a => isSome(check(index, [a], expr))),
          )
          //console.log(matches)
          return pipe(
            matches.length > 0 ? some([group(matches, index)]) : none,
            next(matches.length || 1),
          )
        },

        _: _ => none,
      }),
    )
  }

  const expr = Expr.Group({ exprs })

  return {
    groups: pipe(
      check(0, list, expr),
      getOrElseW(() => []),
    ),
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
            //console.log(x)

            return true
          },
          _: _ => false,
        }),
      )
    }

  const cs = exprs.map(check)

  return list.filter((x, i, ls) => cs.every(c => c(x, i, ls)))
}
