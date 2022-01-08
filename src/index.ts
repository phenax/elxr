import { fold, map } from 'fp-ts/lib/Either'
import { identity, pipe } from 'fp-ts/lib/function'
import { find } from './eval'
import { parser } from './parser'

const toSourceString = (r: string | RegExp): string => typeof r === 'string' ? r : r.source

export const filter = <T>(listExp: string | RegExp, list: T[]): T[] =>
  pipe(
    listExp,
    toSourceString,
    parser,
    map(([lxp, _]) => find(lxp, list)),
    fold(([err, _]) => {
      throw new Error(err)
    }, identity),
  )
