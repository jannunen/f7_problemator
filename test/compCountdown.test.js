import { describe, it, expect } from 'vitest'
import { countdown, URGENT_SECONDS } from '../src/js/helpers/compCountdown.js'

const S = 1000
const M = 60 * S
const H = 60 * M
const D = 24 * H

describe('countdown', () => {
  it('no end to count down to gives null', () => {
    expect(countdown(null)).toBeNull()
    expect(countdown(undefined)).toBeNull()
  })

  it('splits what is left into a padded clock', () => {
    expect(countdown(1 * H + 23 * M + 8 * S)).toMatchObject({ days: 0, clock: '01:23:08' })
    expect(countdown(9 * S)).toMatchObject({ days: 0, clock: '00:00:09' })
  })

  it('whole days come off the clock', () => {
    expect(countdown(2 * D + 3 * H + 4 * M + 5 * S)).toMatchObject({ days: 2, clock: '03:04:05' })
    expect(countdown(1 * D)).toMatchObject({ days: 1, clock: '00:00:00', over: false })
  })

  it('a part second is not shown as a whole one', () => {
    expect(countdown(1999).clock).toBe('00:00:01')
  })

  it('urgent from ten minutes down', () => {
    expect(countdown(URGENT_SECONDS * S + S).urgent).toBe(false)
    expect(countdown(URGENT_SECONDS * S).urgent).toBe(true)
    expect(countdown(30 * S).urgent).toBe(true)
  })

  it('time that has run out stays at zero, never negative', () => {
    expect(countdown(0)).toEqual({ days: 0, clock: '00:00:00', urgent: true, over: true })
    expect(countdown(-37 * M - 3 * S)).toEqual({ days: 0, clock: '00:00:00', urgent: true, over: true })
  })
})
