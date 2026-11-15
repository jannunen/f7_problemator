import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    getTickDates: vi.fn(),
    getArchiveDay: vi.fn(),
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'

beforeEach(() => {
  api.getTickDates.mockReset()
  api.getArchiveDay.mockReset()
})

describe('queries.archiveDates', () => {
  it('calls api.getTickDates with no arguments', async () => {
    api.getTickDates.mockResolvedValue({ dates: { '2026-01-01': 1 } })

    await queries.archiveDates().queryFn()

    expect(api.getTickDates).toHaveBeenCalledWith()
  })
})

describe('queries.archiveDay', () => {
  it('fetches ticks and tries for the span and merges them', async () => {
    const ticks = { foo: 'ticks' }
    const tries = { foo: 'tries' }
    api.getArchiveDay.mockImplementation((payload) =>
      Promise.resolve(payload.type === 'ticks' ? ticks : tries)
    )

    const result = await queries.archiveDay('2026-01').queryFn()

    expect(api.getArchiveDay).toHaveBeenCalledTimes(2)
    expect(api.getArchiveDay).toHaveBeenCalledWith({ span: '2026-01', type: 'ticks' })
    expect(api.getArchiveDay).toHaveBeenCalledWith({ span: '2026-01', type: 'tries' })
    expect(result).toEqual({ ticks, tries })
  })

  it('is disabled until a span is given', () => {
    expect(queries.archiveDay(null).enabled.value).toBe(false)
    expect(queries.archiveDay('2026-01').enabled.value).toBe(true)
  })
})
