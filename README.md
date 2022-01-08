# ListExp [ WIP ]

Regular expression-like syntax for list operations

Example -

```js
filter(/ \T (\s | \n) /, [ null, 0, '2', 3, true ]) // > [ '2', 3 ]
```


### Syntax
Whitespaces are ignore (exceptions: within string literals and nested regex)

* `\s` => Any string
* `\n` => Any number
* `\b` => Any boolean
* `\T` => Any truthy value
* `\F` => Any falsey value
* `a|b` => match `a` **or** `b`
* `a*` => Zero or more consecutive instances of pattern `a` in the list
* `a+` => One or more consecutive instances of pattern `a` in the list
* `(\s\T)` => Group (example matches any non empty string)
* `^a$` => `^` indicates start of list, and `$` indicates end of list
* `a,b` => match `a` followed by `b` (next item)

