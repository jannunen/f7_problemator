import { describe, it, expect } from 'vitest'
import { easeOutCubic, focusViewBox, lerpViewBox } from '../src/pages/gymMapViewTween.js'

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('front-loads progress — past the midpoint before half the duration', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('focusViewBox', () => {
  const problem = { cx: 0.6, cy: 0.3 }

  it('centers the target viewBox on the problem', () => {
    const target = focusViewBox(problem, { x: 0, y: 0, w: 1, h: 1 }, 0.25)
    expect(target.x + target.w / 2).toBeCloseTo(problem.cx)
    expect(target.y + target.h / 2).toBeCloseTo(problem.cy)
  })

  it('zooms in to focusW when the current view is wider (more zoomed out)', () => {
    const target = focusViewBox(problem, { x: 0, y: 0, w: 1, h: 1 }, 0.25)
    expect(target.w).toBe(0.25)
    expect(target.h).toBe(0.25)
  })

  it('never zooms out — keeps the current width when already tighter than focusW', () => {
    const target = focusViewBox(problem, { x: 0.5, y: 0.2, w: 0.1, h: 0.1 }, 0.25)
    expect(target.w).toBe(0.1)
    expect(target.h).toBe(0.1)
  })
})

describe('lerpViewBox', () => {
  const start = { x: 0, y: 0, w: 1, h: 1 }
  const target = { x: 0.4, y: 0.2, w: 0.25, h: 0.25 }

  it('returns the start viewBox at t=0', () => {
    expect(lerpViewBox(start, target, 0)).toEqual(start)
  })

  it('returns the target viewBox at t=1', () => {
    expect(lerpViewBox(start, target, 1)).toEqual(target)
  })

  it('interpolates every field at t=0.5', () => {
    expect(lerpViewBox(start, target, 0.5)).toEqual({ x: 0.2, y: 0.1, w: 0.625, h: 0.625 })
  })
})
