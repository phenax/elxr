import { constructors, Union } from "./utils"

type ExprT = {
  Start: any,
  End: any,
  Optional: { expr: Expr },
  OneOrMore: { expr: Expr },
  ZeroOrMore: { expr: Expr },
  NextItem: any,
  AnyItem: any,
  Or: any,
  AnyString: any,
  AnyNumber: any,
  AnyBool: any,
  Truthy: any,
  Falsey: any,
  Group: { exprs: Expr[] },
}

export type Expr = Union<ExprT>

export const Expr = constructors<ExprT>()

