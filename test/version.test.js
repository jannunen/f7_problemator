import { describe, it, expect } from 'vitest'
import { parseVersion, compareVersions, isUpdateAvailable, buildNumber } from '../src/js/version.js'

describe('parseVersion', () => {
  it('parses the usual shapes', () => {
    expect(parseVersion('1.4.0')).toEqual([1, 4, 0])
    expect(parseVersion('v1.4.0')).toEqual([1, 4, 0])
    expect(parseVersion('1.4')).toEqual([1, 4, 0])
    expect(parseVersion('2')).toEqual([2, 0, 0])
    expect(parseVersion('1.4.0-beta.2')).toEqual([1, 4, 0])
  })

  it('returns null rather than guessing', () => {
    expect(parseVersion(null)).toBeNull()
    expect(parseVersion(undefined)).toBeNull()
    expect(parseVersion('')).toBeNull()
    expect(parseVersion('not a version')).toBeNull()
  })
})

describe('compareVersions', () => {
  it('orders by each component', () => {
    expect(compareVersions('1.4.0', '1.4.0')).toBe(0)
    expect(compareVersions('1.4.1', '1.4.0')).toBe(1)
    expect(compareVersions('1.3.9', '1.4.0')).toBe(-1)
    expect(compareVersions('2.0.0', '1.99.99')).toBe(1)
  })

  it('compares numerically, not as text', () => {
    // "1.10.0" sorts BEFORE "1.9.0" as a string, but 10 > 9 as a number.
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1)
  })

  it('treats equivalent spellings as equal', () => {
    expect(compareVersions('1.4', '1.4.0')).toBe(0)
    expect(compareVersions('v1.4.0', '1.4.0')).toBe(0)
  })
})

describe('isUpdateAvailable', () => {
  it('prompts only when the server is strictly newer', () => {
    expect(isUpdateAvailable('1.4.0', '1.5.0')).toBe(true)
    expect(isUpdateAvailable('1.4.0', '1.4.0')).toBe(false)
    expect(isUpdateAvailable('1.4.0', '1.3.0')).toBe(false)
  })

  // The exact bug this replaces: the backend advertised 0.8.10 while the app
  // was 1.3.2, and `!=` meant every user saw "new version available" forever.
  it('does not nag when the server reports an older version', () => {
    expect(isUpdateAvailable('1.3.2', '0.8.10')).toBe(false)
    expect(isUpdateAvailable('1.4.0', '0.8.10')).toBe(false)
  })

  it('stays quiet when the server version is missing or unreadable', () => {
    expect(isUpdateAvailable('1.4.0', null)).toBe(false)
    expect(isUpdateAvailable('1.4.0', '')).toBe(false)
    expect(isUpdateAvailable('1.4.0', 'unknown')).toBe(false)
  })
})

describe('buildNumber', () => {
  it('increases with the version', () => {
    expect(buildNumber('1.4.0')).toBe(10400)
    expect(buildNumber('1.4.12')).toBe(10412)
    expect(buildNumber('2.0.0')).toBe(20000)
    expect(buildNumber('1.4.0')).toBeLessThan(buildNumber('1.4.1'))
    expect(buildNumber('1.9.99')).toBeLessThan(buildNumber('2.0.0'))
  })

  it('refuses a version it cannot encode monotonically', () => {
    expect(buildNumber('1.100.0')).toBeNull()
    expect(buildNumber('1.0.100')).toBeNull()
    expect(buildNumber('nope')).toBeNull()
  })
})
