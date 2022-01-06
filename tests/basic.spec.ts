import {right} from 'fp-ts/Either'
import { many0, digit, integer, whitespace } from '../src'

describe('Foobar', () => {
  it ('should do shit', () => {
    expect(integer('12901')).toEqual(right([12901, '']))
    expect(integer('12901asas')).toEqual(right([12901, 'asas']))
  })
})

