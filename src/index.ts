import { getOrElseW, map } from 'fp-ts/lib/Either'
import { flow, pipe } from 'fp-ts/lib/function'
import {fst} from 'fp-ts/lib/Tuple'
import * as ev from './eval'
import { parser } from './parser'
import {ListExpr} from './types'

const toSourceString = (r: string | RegExp): string => typeof r === 'string' ? r : r.source

export const liexp: (r: string | RegExp) => ListExpr = flow(
  toSourceString,
  parser,
  map(fst),
  getOrElseW(([e, _]) => { throw new Error(e) })
)

export const matchAll = <T>(exp: string | RegExp, list: T[]) =>
  pipe(
    exp,
    liexp,
    lxp => ev.matchAll(lxp, list),
  )

export const filter = <T>(exp: string | RegExp, list: T[]): T[] =>
  pipe(
    exp,
    liexp,
    lxp => ev.find(lxp, list),
  )
