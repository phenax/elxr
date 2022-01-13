import {Option} from "fp-ts/lib/Option"
import { constructors, Union } from "./utils"

type _ = never

export type Expr = Union<{
  Start: _,
  End: _,
  Optional: { expr: Expr },
  OneOrMore: { expr: Expr },
  ZeroOrMore: { expr: Expr },
  NextItem: _,
  AnyItem: _,
  Or: { left: Expr, right: Expr[] },
  AnyString: _,
  AnyNumber: _,
  AnyBool: _,
  Truthy: _,
  Falsey: _,
  Group: { exprs: Expr[] },
  PropertyMatch: { name: string, exprs: Expr[] },
}>

export const Expr = constructors<Expr>()

export type ListExpr = [
  Option<Expr>,
  Expr[],
  Option<Expr>,
]

