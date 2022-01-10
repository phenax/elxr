import { jlog } from '../src/utils'
import { filter, matchAll } from '../src'

describe('Basic tests', () => {
  it('should do it', () => {
    expect(filter(/\s/, [1, '2', 3, '4'])).toEqual(['2', '4'])
    expect(filter(/\n/, [1, '2', 3, '4'])).toEqual([1, 3])
    expect(filter(/\T/, [1, 0, '4', ''])).toEqual([1, '4'])
    expect(filter(/\F/, [1, 0, '4', ''])).toEqual([0, ''])
    expect(filter(/\F\T/, [1, 0, '4', ''])).toEqual([])
    expect(filter(/\s\T/, [1, 0, '4', ''])).toEqual(['4'])
  })

  fit('should do it', () => {
    // jlog(matchAll(/[age \n]+/, [ {}, { age: 1 }, { age: 2 }, { age: 0 }, '' ]))
    // jlog(matchAll(/[age \n]+/, [ {}, { age: 1 }, '' ]))
    // jlog(matchAll(/([age \T][age \n])+/, [ {}, { age: 1 }, { age: 2 }, { age: 0 }, '' ]))

    jlog(matchAll(/\n/, [ 'b', 1, 'a' ]))
    // jlog(matchAll(/\n\T/, [1, 0, 2, '4', '']))
    // jlog(matchAll(/\n+/, [ '', 1, 2, 0, '', 5, '' ]))
  })
})
