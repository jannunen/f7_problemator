import { describe, it, expect } from 'vitest'
import {
  entryBundleFromHtml,
  precachedUrlsFromServiceWorker,
  precacheConsistencyIssue,
} from '../scripts/checkPrecacheConsistency.mjs'

describe('entryBundleFromHtml', () => {
  it('finds the hashed entry bundle in the built index.html', () => {
    const html = '<script type="module" crossorigin src="./assets/index.189c91a1.js"></script>'
    expect(entryBundleFromHtml(html)).toBe('assets/index.189c91a1.js')
  })

  it('returns null when the build output no longer has that shape', () => {
    expect(entryBundleFromHtml('<html></html>')).toBeNull()
  })
})

describe('precachedUrlsFromServiceWorker', () => {
  it('extracts the URLs workbox actually precached', () => {
    const sw = 'e.precacheAndRoute([{url:"index.html",revision:"abc"},{url:"assets/index.189c91a1.js",revision:"def"}],{ignoreURLParametersMatching:[]})'
    expect(precachedUrlsFromServiceWorker(sw)).toEqual(['index.html', 'assets/index.189c91a1.js'])
  })

  it('returns null when there is no precacheAndRoute manifest to find', () => {
    expect(precachedUrlsFromServiceWorker('self.addEventListener("fetch", () => {})')).toBeNull()
  })
})

describe('precacheConsistencyIssue', () => {
  // The actual bug: this exact combination left every visitor on a
  // precached index.html pointing at a bundle that was never cached, and
  // never would be until the file shrank under workbox's size cap.
  it('flags index.html precached without its entry bundle', () => {
    const issue = precacheConsistencyIssue({
      entryBundle: 'assets/index.189c91a1.js',
      precachedUrls: ['index.html', 'assets/other.js'],
    })
    expect(issue).toMatch(/index.html is precached but its entry bundle/)
  })

  it('is fine when neither index.html nor the bundle is precached', () => {
    expect(precacheConsistencyIssue({
      entryBundle: 'assets/index.189c91a1.js',
      precachedUrls: ['assets/other.js'],
    })).toBeNull()
  })

  it('is fine when both index.html and the bundle are precached', () => {
    expect(precacheConsistencyIssue({
      entryBundle: 'assets/index.189c91a1.js',
      precachedUrls: ['index.html', 'assets/index.189c91a1.js'],
    })).toBeNull()
  })

  it('does not flag a bundle-less precache — nothing to disagree with the HTML about', () => {
    expect(precacheConsistencyIssue({
      entryBundle: 'assets/index.189c91a1.js',
      precachedUrls: [],
    })).toBeNull()
  })
})
