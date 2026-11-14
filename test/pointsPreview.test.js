import { describe, it, expect } from 'vitest'
import { previewPoints } from '../src/js/helpers/pointsPreview.js'

const p = { points_if_topped: { 1: 500, 2: 400, other: 250 } }

describe('previewPoints', () => {
  it('uses the entered tries', () => expect(previewPoints(p, 2, false)).toBe(400))
  it('defaults to one try', () => expect(previewPoints(p, undefined, false)).toBe(500))
  it('falls back to other for unlisted tries', () => expect(previewPoints(p, 7, false)).toBe(250))
  it('is null once topped', () => expect(previewPoints(p, 1, true)).toBeNull())
  it('is null without backend support', () => expect(previewPoints({}, 1, false)).toBeNull())
  it('keeps a zero preview', () => expect(previewPoints({ points_if_topped: { 1: 0 } }, 1, false)).toBe(0))
})
