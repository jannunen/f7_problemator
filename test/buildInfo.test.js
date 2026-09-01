import { describe, it, expect } from 'vitest'
import { formatBuildStamp } from '../src/js/buildInfo.js'

describe('formatBuildStamp', () => {
  it('appends the build id in parentheses when one exists', () => {
    expect(formatBuildStamp('1.5.0', 'a3f9c21')).toBe('1.5.0 (a3f9c21)')
  })

  // The case this exists for: a build from a tarball, or a machine with no
  // git installed, has no SHA to report. It must read as a plain version,
  // never as "1.5.0 (undefined)" or "1.5.0 (null)".
  it('falls back to the plain version when there is no build id', () => {
    expect(formatBuildStamp('1.5.0', null)).toBe('1.5.0')
    expect(formatBuildStamp('1.5.0', undefined)).toBe('1.5.0')
    expect(formatBuildStamp('1.5.0', '')).toBe('1.5.0')
  })
})
