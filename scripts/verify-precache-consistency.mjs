#!/usr/bin/env node
/**
 * Run at the end of `npm run build`, after workbox has written
 * www/service-worker.js. Fails the build loudly if index.html and its
 * entry bundle disagree about precaching — see
 * checkPrecacheConsistency.mjs for what that means and why it matters.
 *
 * Workbox's own warning about a too-large bundle being skipped
 * ("...won't be precached. Configure maximumFileSizeToCacheInBytes...")
 * printed on every build and scrolled past unnoticed for weeks. This is
 * the check that would have caught it on day one.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  entryBundleFromHtml,
  precachedUrlsFromServiceWorker,
  precacheConsistencyIssue,
} from './checkPrecacheConsistency.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wwwDir = path.join(__dirname, '..', 'www')

function fail(message) {
  console.error(`\nverify-precache-consistency: ${message}\n`)
  process.exit(1)
}

let indexHtml
let swSource
try {
  indexHtml = readFileSync(path.join(wwwDir, 'index.html'), 'utf8')
  swSource = readFileSync(path.join(wwwDir, 'service-worker.js'), 'utf8')
} catch (err) {
  fail(`could not read build output (${err.message}). Run this after \`vite build && workbox generateSW\`, not on its own.`)
}

const entryBundle = entryBundleFromHtml(indexHtml)
if (!entryBundle) {
  fail('could not find the entry module script in www/index.html — update entryBundleFromHtml() in checkPrecacheConsistency.mjs if the build output changed shape.')
}

const precachedUrls = precachedUrlsFromServiceWorker(swSource)
if (!precachedUrls) {
  fail("could not find a precacheAndRoute([...]) manifest in www/service-worker.js — update precachedUrlsFromServiceWorker() in checkPrecacheConsistency.mjs if workbox's output changed shape.")
}

const issue = precacheConsistencyIssue({ entryBundle, precachedUrls })
if (issue) {
  fail(issue)
}

const htmlPrecached = precachedUrls.includes('index.html')
const bundlePrecached = precachedUrls.includes(entryBundle)
console.log(
  `verify-precache-consistency: OK — index.html is ${htmlPrecached ? '' : 'NOT '}precached; ` +
  `entry bundle ${entryBundle} is ${bundlePrecached ? '' : 'NOT '}precached. Consistent.`,
)
