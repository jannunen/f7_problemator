import { describe, it, expect } from 'vitest'
import { checkpointOptions, myCheckpointFor } from '../src/js/helpers/checkpoints.js'

describe('checkpointOptions', () => {
  it('lists checkpoints in order then the top', () => {
    const problem = { pivot: { max_points: 25, checkpoints: [{ points: 5 }, { points: 10 }, { points: 15 }] } }
    expect(checkpointOptions(problem)).toEqual([
      { label: 'Checkpoint 1', value: 1, points: 5 },
      { label: 'Checkpoint 2', value: 2, points: 10 },
      { label: 'Checkpoint 3', value: 3, points: 15 },
      { label: 'Top', value: 'top', points: 25 },
    ])
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
