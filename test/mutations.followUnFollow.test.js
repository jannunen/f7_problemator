import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@js/api', () => ({
  default: {
    climber: {
      followUnFollow: vi.fn(),
    },
  },
}))

vi.mock('@js/queryClient', () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
  },
}))

import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'

beforeEach(() => {
  api.climber.followUnFollow.mockReset()
  queryClient.invalidateQueries.mockReset()
})

describe('mutations.followUnFollow', () => {
  it('calls api.climber.followUnFollow with the climber id', async () => {
    api.climber.followUnFollow.mockResolvedValue({ id: 7 })

    await mutations.followUnFollow().mutationFn(7)

    expect(api.climber.followUnFollow).toHaveBeenCalledWith(7)
  })

  it('invalidates that climber profile on success', () => {
    mutations.followUnFollow().onSuccess({ id: 7 }, 7)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['climber-profile', 7],
    })
  })
})
