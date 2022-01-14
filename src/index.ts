import * as Either from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { fst } from 'fp-ts/Tuple'
import * as ev from './eval'
import { parser } from './parser'
import { ListExpr } from './types'

const toSourceString = (r: string | RegExp): string =>
  typeof r === 'string' ? r : r.source

export const liexp: (r: string | RegExp) => ListExpr = flow(
  toSourceString,
  parser,
  Either.map(fst),
  Either.getOrElseW(([e, _]) => {
    throw new Error(e)
  }),
)

export const matchAll = <T>(exp: string | RegExp, list: T[]) =>
  pipe(exp, liexp, lxp => ev.matchAll(lxp, list))
