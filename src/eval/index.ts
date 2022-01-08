import {pipe} from 'fp-ts/function';
import { Expr, ListExpr } from '../types'
import {match} from '../utils';

export const find = <T>([startO, exprs, endO]: ListExpr, list: T[]): any => {
  const check = (expr: Expr) => <T>(x: T, i: number, ls: T[]): boolean => {
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
        _: _ => false,
      })
    )
  };

  const cs = exprs.map(check)

  return list.filter((x, i, ls) => cs.every(c => c(x, i, ls)))
}
