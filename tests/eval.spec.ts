import { left, right } from 'fp-ts/Either'
import { none, some } from 'fp-ts/Option'
import { Expr, ListExpr } from '../src/types'
import { jlog } from '../src/utils'
import { find } from '../src/eval'

describe('Eval', () => {
  it('basic evaluation', () => {
    const list = [0, 1, '2', 3, [4], 5]

    const liexp: ListExpr = [
      none,
      [Expr.AnyNumber(null), Expr.Truthy(null)],
      none,
    ]
    expect(find(liexp, list)).toEqual([1, 3, 5])

    const liexp2: ListExpr = [
      none,
      [Expr.Falsey(null), Expr.Truthy(null)],
      none,
    ]
    expect(find(liexp2, list)).toEqual([])
  })

  it('with groups', () => {
    const list = [0, 1, '2', 3, [4], 5]

    const liexp: ListExpr = [
      none,
      [
        Expr.AnyItem(null),
        Expr.Group({ exprs: [Expr.AnyNumber(null), Expr.Truthy(null)] }),
      ],
      none,
    ]
    expect(find(liexp, list)).toEqual([1, 3, 5])
  })

  it('object property', () => {
    const list = [
      { name: 20, age: 'hello' },
      { name: 'gello', age: 20 },
      { name: '', age: 20 },
      { name: 'Wow' },
      { age: 20 },
    ]

    const liexp: ListExpr = [
      none,
      [
        Expr.PropertyMatch({
          name: 'name',
          exprs: [Expr.AnyString(null), Expr.Truthy(null)],
        }),
        Expr.PropertyMatch({ name: 'age', exprs: [Expr.AnyNumber(null)] }),
      ],
      none,
    ]

    expect(find(liexp, list)).toEqual([{ name: 'gello', age: 20 }])
  })
})
