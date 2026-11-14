import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(async () => ({ data: {} })),
    delete: vi.fn(async () => ({ data: {} })),
  },
}))

import axios from 'axios'
import api, { endpoint } from '../src/js/api.js'

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

  it('posts to the signed-in route when no prefix is given', async () => {
    await api.saveCheckpoint({ compid: 7, problemid: 42, checkpoint: 1 })

    expect(axios.post.mock.calls[0][0]).toBe(endpoint + '/competitions/7/checkpoints')
  })

  it('posts to the compkey route with the point entry key', async () => {
    await api.saveCheckpoint({ compid: 7, problemid: 42, checkpoint: 1, point_entry_key: 'abc' }, '/compkey')

    const [url, body] = axios.post.mock.calls[0]
    expect(url).toBe(endpoint + '/compkey/competitions/7/checkpoints?key=abc')
    expect(body).not.toHaveProperty('point_entry_key')
  })
})

describe('api.deleteCheckpoint', () => {
  it('deletes on the signed-in route when no prefix is given', async () => {
    await api.deleteCheckpoint({ compid: 7, problemid: 42 })

    expect(axios.delete.mock.calls[0][0]).toBe(endpoint + '/competitions/7/checkpoints/42')
  })

  it('deletes on the compkey route with the point entry key', async () => {
    await api.deleteCheckpoint({ compid: 7, problemid: 42, point_entry_key: 'abc' }, '/compkey')

    expect(axios.delete.mock.calls[0][0]).toBe(endpoint + '/compkey/competitions/7/checkpoints/42?key=abc')
  })
})
