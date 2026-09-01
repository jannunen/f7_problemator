import { describe, it, expect } from 'vitest'
import { parseVersion, compareVersions, isUpdateAvailable, buildNumber, shouldShowUpdateBanner } from '../src/js/version.js'

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

describe('shouldShowUpdateBanner', () => {
  it('shows when the server advertises something newer, worker or not', () => {
    expect(shouldShowUpdateBanner({ localVersion: '1.4.0', serverVersion: '1.5.0', waitingWorkerAvailable: false })).toBe(true)
    expect(shouldShowUpdateBanner({ localVersion: '1.4.0', serverVersion: '1.5.0', waitingWorkerAvailable: true })).toBe(true)
  })

  // The exact scenario this exists for: package.json and config/mobile.php
  // agree (both 1.5.0), so the version comparison alone would stay silent
  // forever — even though a new worker is genuinely waiting on the device.
  it('shows on a waiting worker alone, even when the version strings match', () => {
    expect(shouldShowUpdateBanner({ localVersion: '1.5.0', serverVersion: '1.5.0', waitingWorkerAvailable: true })).toBe(true)
  })

  it('stays quiet when neither signal fires', () => {
    expect(shouldShowUpdateBanner({ localVersion: '1.5.0', serverVersion: '1.5.0', waitingWorkerAvailable: false })).toBe(false)
    expect(shouldShowUpdateBanner({ localVersion: '1.5.0', serverVersion: '1.4.0', waitingWorkerAvailable: false })).toBe(false)
  })

  it('is not fooled by an older server version once a worker is waiting', () => {
    // Belt and braces: even a server report that looks like a downgrade
    // must not suppress a waiting worker, which is the ground truth.
    expect(shouldShowUpdateBanner({ localVersion: '1.5.0', serverVersion: '1.0.0', waitingWorkerAvailable: true })).toBe(true)
  })
})
