# Tiny Formula

![Node.js CI](https://github.com/taggon/tiny-formula/actions/workflows/node.js.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/taggon/tiny-formula/badge.svg?branch=main)](https://coveralls.io/github/taggon/tiny-formula?branch=main)
![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)

> A lightweight toolset for parsing excel-like formulas and calculating with custom functions.

No dependencies.

## Installation

Using npm:

```
$ npm i --save tiny-formula
```

Or using yarn:

```
$ yarn add tiny-formula
```

## API

### parse()

The `parse()` function takes a formula string and returns a tree of nodes.

```ts
parse(formula: string): Node
```

A `Node` is a plain object containing a `type` property and other properties depending on the node type. Note that `parse()` does NOT check if the cells exist or not. It only syntactically parses the formula to create a tree.

Be careful that all cell names and function names should be uppercased. Lowercased letters are not allowed for the names.

In most cases, you may want to use `calc()` which calculates the formula instead of `parse()`.

### calc()

The `calc()` function takes a formula string, a set of data and a list of functions and returns the result. The optional second parameter should be a two-dimensional array of data. Every function name should be uppercased.

```ts
calc(
    formula: string,
    data: any[][],
    functions: {[string]: Function}
): any
```

A cell range is always transformed to a two-dimensional array of data whether there's a data array or not.

### Exceptions

While parsing, or calculating the formula, `parse()` and `calc()` may throw exceptions if something went wrong. The followings are the exceptions thrown by those functions:

| Type                     | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `UnexpectedTokenError`   | Unexpected token found.                               |
| `CellNotFoundError`      | The referred cell doesn't exist in the given dataset. |
| `UndefinedFunctionError` | Undefined function is called.                         |

## Examples

### Parsing a formula string into a tree

```js
import { parse } from 'tiny-formula';

parse('A1+B2');
/**
result:
{
    type: 'group',
    items: [
        {
            type: 'cell',
            name: 'A1',
        },
        {
            type: 'operator',
            op: '+',
        },
        {
            type: 'cell',
            name: 'B2',
        },
    ],
}
**/

parse('FN(TRUE)');
/**
{
    type: 'func',
    items: [
        {
            type: 'literal',
            value: true
        }
    ]
}
*/

parse('FN(,TRUE)'); // throws an UnexpectedToken exception
```

### Calculation

```js
import { calc } from 'tiny-formula';

calc('A1+C1', [[10, 20, 30]]); // 40
calc('"Hello ," & "world!"'); // Hello, world!
calc('D1*10', [[10, 20, 30]]); // throws a CellNotFoundError exception
calc('SQRT(A1)', [[9]], { SQRT: Math.sqrt }); // 3
calc('UNDEFINED()'); // throws a UndefinedFunctionError exception
```

## License

Tiny Formula is released under MIT license.
