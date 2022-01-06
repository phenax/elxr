import {left, right} from 'fp-ts/Either'
import { many0, digit, integer, whitespace, suffixed, prefixed, whitespaces0, delimited, symbol } from '../src/parser'

describe('Foobar', () => {
  it ('should do shit', () => {
    expect(integer('12901')).toEqual(right([12901, '']))
    expect(integer('12901asas')).toEqual(right([12901, 'asas']))
    expect(whitespace(' ')).toEqual(right([' ', '']))
    expect(whitespace('\n')).toEqual(right(['\n', '']))
    expect(whitespace('a')).toEqual(left(['unable to match', 'a']))

    expect(delimited(whitespaces0, integer, whitespaces0)(' 20 ')).toEqual(right([20, '']))
    expect(delimited(whitespaces0, integer, whitespaces0)(' 2 0 ')).toEqual(right([2, '0 ']))
  })
})

