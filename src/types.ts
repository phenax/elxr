
export type Expr =
  | { tag: 'Start' }
  | { tag: 'End' }
  | { tag: 'Optional'; expr: Expr }
  | { tag: 'OneOrMore'; expr: Expr }
  | { tag: 'ZeroOrMore'; expr: Expr }
  | { tag: 'NextItem' }
  | { tag: 'AnyItem' }
  | { tag: 'Or' }
  | { tag: 'AnyString' }
  | { tag: 'AnyNumber' }
  | { tag: 'AnyBool' }
  | { tag: 'Truthy' }
  | { tag: 'Falsey' }
  | { tag: 'Group'; exprs: Expr[] }

