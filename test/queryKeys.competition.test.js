import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    getCompetition: vi.fn(),
    getCompResults: vi.fn(),
  },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'
import { setAuthToken } from '@js/authToken.js'

beforeEach(() => {
  api.getCompetition.mockReset()
  api.getCompResults.mockReset()
  setAuthToken(null)
})

describe('queries.competition', () => {
  it('calls api.getCompetition with {compid}', async () => {
    api.getCompetition.mockResolvedValue({ id: 7 })
    setAuthToken('a.real.jwt')

    await queries.competition(7).queryFn()

    expect(api.getCompetition).toHaveBeenCalledWith({ compid: 7 })
  })

  it('is disabled until a compid is given', () => {
    setAuthToken('a.real.jwt')

    expect(queries.competition(null).enabled.value).toBe(false)
    expect(queries.competition(7).enabled.value).toBe(true)
  })

  /**
   * JudgingComponent.vue can mount on a deep link before the JWT is restored
   * into axios's headers; the old code only re-dispatched getCompetition on
   * an isAuthenticated CHANGE, which never fires for a climber already
   * signed in when the page mounted, so `comp` never loaded for them. Also
   * gated here, like gyms/profile/competitions/etc.
   */
  it('is disabled until signed in, even with a compid', () => {
    expect(queries.competition(7).enabled.value).toBe(false)

    setAuthToken('a.real.jwt')

    expect(queries.competition(7).enabled.value).toBe(true)
  })
})

describe('queries.publicCompetition', () => {
  it('calls api.getCompetition with {compid, point_entry_key} and the /compkey prefix', async () => {
    api.getCompetition.mockResolvedValue({ id: 7 })

    await queries.publicCompetition(7, 'abc').queryFn()

    expect(api.getCompetition).toHaveBeenCalledWith({ compid: 7, point_entry_key: 'abc' }, '/compkey')
  })

  it('is disabled until a compid is given, without needing to be signed in', () => {
    expect(queries.publicCompetition(null, 'abc').enabled.value).toBe(false)
    expect(queries.publicCompetition(7, 'abc').enabled.value).toBe(true)
  })
})

describe('queries.compResults', () => {
  it('calls api.getCompResults with {compid}', async () => {
    api.getCompResults.mockResolvedValue({ results: [] })
    setAuthToken('a.real.jwt')

    await queries.compResults(7).queryFn()

    expect(api.getCompResults).toHaveBeenCalledWith({ compid: 7 })
  })

  it('is disabled until signed in, even with a compid', () => {
    expect(queries.compResults(7).enabled.value).toBe(false)

    setAuthToken('a.real.jwt')

    expect(queries.compResults(7).enabled.value).toBe(true)
  })
})

describe('queries.publicCompResults', () => {
  it('calls api.getCompResults with {compid, point_entry_key} and the /compkey prefix', async () => {
    api.getCompResults.mockResolvedValue({ results: [] })

    await queries.publicCompResults(7, 'abc').queryFn()

    expect(api.getCompResults).toHaveBeenCalledWith({ compid: 7, point_entry_key: 'abc' }, '/compkey')
  })

  it('is disabled until a compid is given, without needing to be signed in', () => {
    expect(queries.publicCompResults(null, 'abc').enabled.value).toBe(false)
    expect(queries.publicCompResults(7, 'abc').enabled.value).toBe(true)
  })
})
