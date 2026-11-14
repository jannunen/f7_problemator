import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: {} })),
  },
}))

import axios from 'axios'
import api from '../src/js/api.js'

beforeEach(() => {
  axios.post.mockClear()
  axios.delete.mockClear()
})

describe('api.saveCheckpoint', () => {
  it('forwards a score field for sport type comps', async () => {
    await api.saveCheckpoint({ compid: 7, problemid: 42, score: 25.25 })

    const [url, body] = axios.post.mock.calls[0]
    expect(url).toMatch(/\/competitions\/7\/checkpoints$/)
    expect(body).toMatchObject({ problemid: 42, score: 25.25 })
  })

  it('omits score when the caller does not send one', async () => {
    await api.saveCheckpoint({ compid: 7, problemid: 42, checkpoint: 1 })

    const [, body] = axios.post.mock.calls[0]
    expect(body).toEqual({ problemid: 42, checkpoint: 1 })
  })
})
