import { left, right } from 'fp-ts/Either'
import { none, some } from 'fp-ts/Option'
import { Expr, ListExpr } from '../src/types'
import { jlog } from '../src/utils'
import { find, matchAll } from '../src/eval'

describe('Eval', () => {
  it('should do stuff', () => {
    const ls = [-1, 1, 2, '3', 4, '5', 6, 7, '']

    const liexp: ListExpr = [
      none,
      Expr.OneOrMore({
        expr: Expr.Group({
          exprs: [Expr.AnyNumber(), Expr.Truthy()],
        }),
      }),
      none,
    ]

    //jlog(matchAll(liexp, ls))
  })

  it('basic evaluation', () => {
    const list = [0, 1, '2', 3, [4], 5]

    const liexp: ListExpr = [none, Expr.Group({ exprs: [Expr.AnyNumber(), Expr.Truthy()] }), none]
    expect(find(liexp, list)).toEqual([1, 3, 5])

    const liexp2: ListExpr = [none, Expr.Group({ exprs: [Expr.Falsey(), Expr.Truthy()] }), none]
    expect(find(liexp2, list)).toEqual([])
  })

  it('with groups', () => {
    const list = [0, 1, '2', 3, [4], 5]

    const liexp: ListExpr = [
      none,
      Expr.Group({ exprs: [
        Expr.AnyItem(),
        Expr.Group({ exprs: [Expr.AnyNumber(), Expr.Truthy()] }),
      ] }),
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
      Expr.Group({ exprs: [
        Expr.PropertyMatch({
          name: 'name',
          expr: Expr.Group({ exprs: [Expr.AnyString(), Expr.Truthy()] }),
        }),
        Expr.PropertyMatch({
          name: 'age',
          expr: Expr.Group({ exprs: [Expr.AnyNumber()] }),
        }),
      ] }),
      none,
    ]

    expect(find(liexp, list)).toEqual([{ name: 'gello', age: 20 }])
  })
})
