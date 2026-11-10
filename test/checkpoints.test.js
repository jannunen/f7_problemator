import { describe, it, expect } from 'vitest'
import { checkpointOptions, myCheckpointFor, TRIES_AND_BONUS_TYPES } from '../src/js/helpers/checkpoints.js'

describe('checkpointOptions', () => {
  it('lists checkpoints in order then the top, with no label by default', () => {
    const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5 }, { points: 10 }, { points: 15 }] } }
    expect(checkpointOptions(problem)).toEqual([
      { label: null, value: 1, points: 5 },
      { label: null, value: 2, points: 10 },
      { label: null, value: 3, points: 15 },
      { label: 'Top', value: 'top', points: 25 },
    ])
  })
  it('uses a checkpoint\'s custom label, trimmed, when set', () => {
    const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5, label: 'A' }, { points: 10, label: '  C  ' }] } }
    expect(checkpointOptions(problem)).toEqual([
      { label: 'A', value: 1, points: 5 },
      { label: 'C', value: 2, points: 10 },
      { label: 'Top', value: 'top', points: 25 },
    ])
  })
  it('treats a blank or whitespace-only label the same as no label', () => {
    const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5, label: '' }, { points: 10, label: '   ' }] } }
    expect(checkpointOptions(problem).map((o) => o.label)).toEqual([null, null, 'Top'])
  })
  it('offers only the top when there are no checkpoints', () => {
    expect(checkpointOptions({ pivot: { max_points: 25, checkpoints: null } })).toEqual([
      { label: 'Top', value: 'top', points: 25 },
    ])
    expect(checkpointOptions({ pivot: { max_points: 25, checkpoints: [] } })).toHaveLength(1)
  })
  it('copes with a problem that has no pivot', () => {
    expect(checkpointOptions(undefined)).toEqual([{ label: 'Top', value: 'top', points: 0 }])
  })
})

describe('TRIES_AND_BONUS_TYPES', () => {
  it('lists the comp types scored from tries-to-bonus + tries-to-top', () => {
    expect(TRIES_AND_BONUS_TYPES).toEqual(['traditional', 'ifsc_2018_bouldering', 'flashcomp'])
  })
})

describe('myCheckpointFor', () => {
  it('reads the stored index', () => {
    expect(myCheckpointFor({ 7: 2 }, 7)).toBe(2)
    expect(myCheckpointFor({ 7: '3' }, 7)).toBe(3)
  })
  it('is null when absent, empty or an empty PHP array', () => {
    expect(myCheckpointFor({}, 7)).toBeNull()
    expect(myCheckpointFor([], 7)).toBeNull()
    expect(myCheckpointFor(undefined, 7)).toBeNull()
  })
})
