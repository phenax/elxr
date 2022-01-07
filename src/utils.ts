export const eq =
  <T>(a: T) =>
  (b: T): boolean =>
    a === b

export const match =
  <R, K extends string>(pattern: { [key in K | '_']: () => R }) =>
  (k: K): R =>
    (pattern[k] || pattern._)()
