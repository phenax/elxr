export const eq =
  <T>(a: T) =>
  (b: T): boolean =>
    a === b

type TagValue<T, N> = T extends Tag<N, infer V> ? V : never;

export const match =
  <R, T extends Tag<string, any>>
  (pattern: { [key in T['tag'] | '_']?: (v: TagValue<T, key>) => R }) =>
    (tag: T): R =>
      (pattern[tag.tag] || pattern._ as any)(tag.value)

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

