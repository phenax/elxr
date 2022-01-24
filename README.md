# ListExp [ WIP ]

Regular expression-like syntax for list operations. Toy project experimenting with generalizing regex-like operations to a list.

[![forthebadge](https://forthebadge.com/images/badges/you-didnt-ask-for-this.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/kinda-sfw.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/0-percent-optimized.svg)](https://forthebadge.com)


### Syntax
Whitespaces are ignored (except within literals)

* `\s` => Any **string**
* `\n` => Any **number**
* `\b` => Any **boolean**
* `\T` => Any **truthy** value
* `\F` => Any **falsey** value
* `a|b` => match `a` **or** `b`
* `a*` => **Zero or more** consecutive instances of pattern `a` in the list
* `a+` => **One or more** consecutive instances of pattern `a` in the list
* `a{2, 5}` => **Min-Max** quantifiers (example matches `a` more than 2 times but less than 5)
* `(\s\T)` => **Group** (example matches any non-empty string)
* `^a$` => `^` indicates **start** of list, and `$` indicates **end** of list [TODO]
* `a,b` => match `a` on current item followed by `b` on the next item (**sequence**)
* `[name \s\T]` => match **property** of object (example matches items with property `name` as non-empty string)
* `> n` | `>= n` | `< n` | `<= n` => **Comparison** with literal number [TODO]
* `/pat/` => Test string values against **regex** [TODO]
* `"foobar"` => String literal (example matches the string `foobar`)
* `-2.05` => Number literal (example matches the number `-2.05`)
* `true` => Boolean literal (example matches the value `true`)


### TODO
  - [ ] `replaceAll` function
  - [ ] `match` function
  - [ ] Named capture groups
  - [ ] Non-capturing groups
  - [ ] Regular expressions for string items
  - [ ] Nested list evaluation
  - [ ] Number comarison


### Examples

```js
// | Match for any number or any non-empty string or any object with `prop` is true
matchAll(/ \n | \s\T | [prop true] /, [null, 23, 'wow', '', { prop: true }, { prop: false } ]
// > {
//   groups: [
//     { index: 1, value: 23 }, // \n
//     { index: 2, value: 'wow' }, // \s\T
//     { index: 4, value: { prop: true } }, // [prop true]
//   ]
// }
```

```js
// | Match for property `seperator` true, followed by one or more list of id's that are non-empty strings
matchAll(/ [seperator true], [id \s\T]+ /, [
  { seperator: true },
  { id: '1' },
  { id: '2' },
  { id: '3' },
  { seperator: true },
  { id: '4' },
  { id: '5' },
  { id: '6' },
])
// > {
//   groups: [
//     {
//       index: 0,
//       value: [
//         [{ value: { seperator: true }, index: 0 }],
//         [{ value: [{ id: '1' }, { id: '2' }, { id: '3' }], index: 1 }],
//       ],
//     },
//     {
//       index: 4,
//       value: [
//         [{ value: { seperator: true }, index: 4 }],
//         [{ value: [{ id: '4' }, { id: '5' }, { id: '6' }], index: 5 }],
//       ],
//     },
//   ]
// }
```

