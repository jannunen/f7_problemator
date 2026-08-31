import { describe, it, expect } from 'vitest'
import { formatMoney } from '../src/js/helpers/money.js'

describe('formatMoney', () => {
  it('formats cents as a Finnish-locale euro price', () => {
    // fi-FI's separator between amount and symbol is a non-breaking space
    // (U+00A0), not a plain one — Intl puts it there, so the expectation is
    // built from an escape rather than a character that looks identical to
    // a plain space in an editor but would not match.
    expect(formatMoney(490, 'EUR', 'fi')).toBe('4,90 €')
  })

  it('formats the same amount differently in another app locale', () => {
    expect(formatMoney(490, 'EUR', 'en')).toBe('€4.90')
  })

  it('does not assume EUR — the currency comes from the payload', () => {
    expect(formatMoney(490, 'USD', 'en')).toContain('4.90')
    expect(formatMoney(490, 'USD', 'en')).not.toContain('€')
  })

  it('falls back to a sane tag for an app locale it does not know', () => {
    expect(formatMoney(490, 'EUR', 'xx')).toBe('€4.90')
  })

  it('returns null rather than a fake price when the payload is incomplete', () => {
    expect(formatMoney(null, 'EUR', 'en')).toBeNull()
    expect(formatMoney(490, null, 'en')).toBeNull()
    expect(formatMoney(undefined, undefined, 'en')).toBeNull()
  })
})
