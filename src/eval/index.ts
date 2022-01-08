import {pipe} from 'fp-ts/function';
import { Expr, ListExpr } from '../types'
import {match} from '../utils';

export const find = <T>([startO, exprs, endO]: ListExpr, list: T[]): any => {
  const check = (e: Expr) => <T>(x: T, _i: number, _l: T[]): boolean => {
    return pipe(
      e.tag as any,
      match({
        AnyItem: () => true,
        AnyNumber: () => typeof x === 'number',
        AnyString: () => typeof x === 'string',
        AnyBool: () => typeof x === 'boolean',
        Truthy: () => !!x,
        Falsey: () => !x,
        _: () => false,
      })
    )
  };
  
  const cs = exprs.map(check)

  return list.filter((x, i, ls) => cs.every(c => c(x, i, ls)))
}
