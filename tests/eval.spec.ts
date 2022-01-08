import { left, right } from 'fp-ts/Either'
import { none, some } from 'fp-ts/Option'
import { Expr, ListExpr } from '../src/types'
import { jlog } from '../src/utils'
import { find } from '../src/eval'

describe('Eval', () => {
  it('should do shit', () => {
    const liexp: ListExpr = [
      none,
      [ Expr.AnyNumber(null), Expr.Truthy(null) ],
      none,
    ]

    const list = [0, 1, '2', 3, [4], 5]

    expect(find(liexp, list)).toEqual([1, 3, 5])
  })
})

