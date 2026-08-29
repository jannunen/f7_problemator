import { describe, it, expect } from 'vitest'
import { errorSignature, nextBoundaryState, afterRetry, MAX_RETRIES } from '@helpers/errorBoundary'

describe('errorSignature', () => {
  it('distinguishes different failures', () => {
    expect(errorSignature(new TypeError("Cannot read properties of null (reading 'categories')"), '/comps/374'))
      .not.toBe(errorSignature(new TypeError("Cannot read properties of null (reading 'grade')"), '/comps/374'))
  })

  it('scopes by route, so an unrelated screen starts its own count', () => {
    const err = new Error('boom')
    expect(errorSignature(err, '/comps/374')).not.toBe(errorSignature(err, '/problems'))
  })

  it('survives a thrown non-Error', () => {
    expect(errorSignature('just a string', '/x')).toContain('just a string')
    expect(errorSignature(null, '/x')).toContain('unknown')
    expect(errorSignature(undefined)).toContain('unknown')
  })
})

describe('nextBoundaryState', () => {
  const err = new TypeError("Cannot read properties of null (reading 'categories')")

  it('offers a retry the first time a screen fails', () => {
    const s = nextBoundaryState(err, '/comps/374')
    expect(s.canRetry).toBe(true)
    expect(s.retries).toBe(0)
    expect(s.message).toContain('categories')
  })

  // The null-dereference class re-throws immediately on retry. Offering the
  // button again turns it into a loop the user presses forever.
  it('stops offering retry when the same error repeats on the same screen', () => {
    let s = nextBoundaryState(err, '/comps/374')
    s = afterRetry(s)
    const again = nextBoundaryState(err, '/comps/374', s)
    expect(again.canRetry).toBe(false)
    expect(again.retries).toBe(MAX_RETRIES)
  })

  it('gives a different error on the same screen its own allowance', () => {
    let s = nextBoundaryState(err, '/comps/374')
    s = afterRetry(s)
    const other = nextBoundaryState(new Error('something else'), '/comps/374', s)
    expect(other.canRetry).toBe(true)
    expect(other.retries).toBe(0)
  })

  it('gives the same error on a different screen its own allowance', () => {
    let s = nextBoundaryState(err, '/comps/374')
    s = afterRetry(s)
    const elsewhere = nextBoundaryState(err, '/problems', s)
    expect(elsewhere.canRetry).toBe(true)
  })

  it('reports a message even when something odd was thrown', () => {
    expect(nextBoundaryState('a string', '/x').message).toBe('a string')
    expect(nextBoundaryState(null, '/x').message).toBe('Unknown error')
  })
})

describe('afterRetry', () => {
  it('closes the door on the attempt it just spent', () => {
    const s = afterRetry(nextBoundaryState(new Error('x'), '/x'))
    expect(s.retries).toBe(1)
    expect(s.canRetry).toBe(false)
  })
})
