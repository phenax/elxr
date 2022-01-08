export const eq =
  <T>(a: T) =>
  (b: T): boolean =>
    a === b

export const match =
  <R, K extends string>(pattern: { [key in K | '_']: () => R }) =>
  (k: K): R =>
    (pattern[k] || pattern._)()

type Tag<N, V> = { tag: N; value: V }
export type Union<T> = { [N in keyof T]: Tag<N, T[N]> }[keyof T]

export const constructors = <T extends Record<string, any>>(): {
  [N in keyof T]: (value: T[N]) => Union<T> // Tag<N, T[N]>
} =>
  new Proxy(
    {},
    {
      get(_, k) {
        return (value: any) => ({ tag: k, value })
      },
    },
  ) as any

export const jlog = (x: any) => console.log(JSON.stringify(x, null, 2))

