import * as Either from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { fst } from 'fp-ts/Tuple'
import * as ev from './eval'
import { parser } from './parser'
import { index, ListExpr } from './types'

const toSourceString = (r: string | RegExp): string =>
  typeof r === 'string' ? r : r.source

const elxr: (r: string | RegExp) => ListExpr = flow(
  toSourceString,
  parser,
  Either.map(fst),
  Either.getOrElseW(([e, _]) => {
    throw new Error(e)
  }),
)

export const matchAll = <T>(exp: string | RegExp, list: T[]) =>
  pipe(exp, elxr, lxp => ev.matchAll(lxp, list))

export const replaceAll = <T>(exp: string | RegExp, replacer: (v: T, m: ev.MatchGroupIndexed<T>, i: index) => T[], list: T[]) =>
  pipe(exp, elxr, lxp => ev.replaceAll(lxp, replacer, list))
