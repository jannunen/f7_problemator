import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@js/api', () => ({
  default: {
    likeProblem: vi.fn(),
    dislikeProblem: vi.fn(),
    commentProblem: vi.fn(),
    reportProblem: vi.fn(),
    getProblemDetails: vi.fn(),
    deleteProject: vi.fn(),
  },
}))

vi.mock('@js/queryClient', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
  },
}))

import api from '@js/api'
import { queryClient } from '@js/queryClient'
import { mutations } from '@js/mutations'
import { useGymStore } from '@js/stores/gym.store.js'
import { pinia } from '@js/stores/index.js'

// mutations.js reads gymid through the explicit shared `pinia` instance, the
// same module-scope-explicit-instance pattern mutations.getClimberByKey.test.js
// uses for the climber store — the gym store must be read, not mocked, so a
// drift between the gymid these mutations build their setQueryData key from
// and the gymid queries.profile(gymid) builds its queryKey from would be the
// exact silent cache-key mismatch Task 3's compid bug was.
beforeEach(() => {
  setActivePinia(createPinia())
  api.likeProblem.mockReset()
  api.dislikeProblem.mockReset()
  api.commentProblem.mockReset()
  api.reportProblem.mockReset()
  api.getProblemDetails.mockReset()
  api.deleteProject.mockReset()
  queryClient.setQueryData.mockReset()
  queryClient.invalidateQueries.mockReset()
  useGymStore(pinia).setGymid(42)
})

// Captures the (key, updater) setQueryData was called with and runs the
// updater against `old`, the same way the real queryClient would — same
// helper test/mutations.competition.test.js uses.
const patched = (old) => {
  const [key, updater] = queryClient.setQueryData.mock.calls.at(-1)
  return { key, next: updater(old) }
}

const profileWith = (problems) => ({ gym: { problems } })

describe('mutations.likeProblem', () => {
  it('calls api.likeProblem with the bare id', async () => {
    api.likeProblem.mockResolvedValue({ likeCount: 3, dislikeCount: 1 })

    await mutations.likeProblem().mutationFn(5)

    expect(api.likeProblem).toHaveBeenCalledWith(5)
  })

  // Ported verbatim from store.js's likeProblem action: both the legacy
  // c_like/c_dislike fields (read by older templates) and the newer
  // likeCount/dislikeCount fields get the fresh count.
  it('patches c_like/likeCount/c_dislike/dislikeCount on the matching problem', () => {
    mutations.likeProblem().onSuccess({ likeCount: 3, dislikeCount: 1 }, 5)

    const { key, next } = patched(profileWith([{ id: 5, likeCount: 2, dislikeCount: 1 }, { id: 9 }]))
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([
      { id: 5, likeCount: 3, dislikeCount: 1, c_like: 3, c_dislike: 1 },
      { id: 9 },
    ])
  })

  it('invalidates publicAscents and newProblems, matching the old action', () => {
    mutations.likeProblem().onSuccess({ likeCount: 3, dislikeCount: 1 }, 5)

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(['public-ascents', 'new-problems']))
  })

  it('does nothing when the profile cache has no gym.problems yet', () => {
    mutations.likeProblem().onSuccess({ likeCount: 3, dislikeCount: 1 }, 5)

    const { next } = patched({ gym: null })
    expect(next).toEqual({ gym: null })
  })

  // gymid is read from the Pinia gym store at the moment onSuccess runs, not
  // captured when the mutation factory was called — a gym switch mid-session
  // must patch the NEW gym's cache entry, the same key queries.profile(gymid)
  // would build for whatever gymid is current right now.
  it('builds the setQueryData key from whatever gymid is current right now', () => {
    useGymStore(pinia).setGymid(99)
    mutations.likeProblem().onSuccess({ likeCount: 1, dislikeCount: 0 }, 5)

    const [key] = queryClient.setQueryData.mock.calls.at(-1)
    expect(key).toEqual(['profile', 99])
  })
})

describe('mutations.dislikeProblem', () => {
  it('calls api.dislikeProblem with the bare id', async () => {
    api.dislikeProblem.mockResolvedValue({ likeCount: 2, dislikeCount: 4 })

    await mutations.dislikeProblem().mutationFn(5)

    expect(api.dislikeProblem).toHaveBeenCalledWith(5)
  })

  // Unlike likeProblem, the old dislikeProblem action never touched
  // c_like/c_dislike — only likeCount/dislikeCount.
  it('patches only likeCount/dislikeCount, leaving c_like/c_dislike untouched', () => {
    mutations.dislikeProblem().onSuccess({ likeCount: 2, dislikeCount: 4 }, 5)

    const { next } = patched(profileWith([{ id: 5, likeCount: 2, dislikeCount: 3, c_like: 2, c_dislike: 3 }]))
    expect(next.gym.problems).toEqual([{ id: 5, likeCount: 2, dislikeCount: 4, c_like: 2, c_dislike: 3 }])
  })

  it('invalidates publicAscents and newProblems, matching the old action', () => {
    mutations.dislikeProblem().onSuccess({ likeCount: 2, dislikeCount: 4 }, 5)

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(expect.arrayContaining(['public-ascents', 'new-problems']))
  })
})

describe('mutations.commentProblem', () => {
  it('calls api.commentProblem with the full {id, comment} payload', async () => {
    api.commentProblem.mockResolvedValue({ messages: [] })

    await mutations.commentProblem().mutationFn({ id: 5, comment: 'nice route' })

    expect(api.commentProblem).toHaveBeenCalledWith({ id: 5, comment: 'nice route' })
  })

  it('patches messages and messageCount (messages.length) on the matching problem', () => {
    const messages = [{ id: 1, text: 'a' }, { id: 2, text: 'b' }]
    mutations.commentProblem().onSuccess({ messages }, { id: 5, comment: 'b' })

    const { next } = patched(profileWith([{ id: 5, messages: [], messageCount: 0 }]))
    expect(next.gym.problems).toEqual([{ id: 5, messages, messageCount: 2 }])
  })

  it('does not invalidate anything, matching the old action', () => {
    mutations.commentProblem().onSuccess({ messages: [] }, { id: 5, comment: 'x' })

    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })
})

describe('mutations.reportProblem', () => {
  it('calls api.reportProblem with the full {id, type, note} payload', async () => {
    api.reportProblem.mockResolvedValue({ reports: {} })

    await mutations.reportProblem().mutationFn({ id: 5, type: 'dirty', note: 'chalky' })

    expect(api.reportProblem).toHaveBeenCalledWith({ id: 5, type: 'dirty', note: 'chalky' })
  })

  it('patches reports on the matching problem', () => {
    const reports = { dirty: 1, mine: { dirty: true } }
    mutations.reportProblem().onSuccess({ reports }, { id: 5, type: 'dirty', note: '' })

    const { next } = patched(profileWith([{ id: 5, reports: {} }]))
    expect(next.gym.problems).toEqual([{ id: 5, reports }])
  })

  // The old action guarded with `if (problem) { commit(...) }` — a report for
  // a problem not in the cached array is skipped outright, not inserted.
  it('does nothing when the problem is not in the cached array (the old if(problem) guard)', () => {
    mutations.reportProblem().onSuccess({ reports: { dirty: 1 } }, { id: 999, type: 'dirty', note: '' })

    const { next } = patched(profileWith([{ id: 5 }]))
    expect(next.gym.problems).toEqual([{ id: 5 }])
  })
})

describe('mutations.getProblemDetails', () => {
  it('calls api.getProblemDetails with the bare id and resolves with ret.problem', async () => {
    api.getProblemDetails.mockResolvedValue({ problem: { id: 5, name: 'Test route' } })

    const ret = await mutations.getProblemDetails().mutationFn(5)

    expect(api.getProblemDetails).toHaveBeenCalledWith(5)
    expect(ret).toEqual({ id: 5, name: 'Test route' })
  })

  // Ported verbatim from store.js's getProblemDetails action:
  // `{...curProblem, ...problem}` — detail-endpoint-only fields (messages,
  // grade_opinions, reports...) merge ONTO whatever was already cached,
  // rather than replacing it, so a plain refetch could not substitute for
  // this (it would drop fields the list endpoint never returns).
  it('merges the detail response onto the existing cached problem', () => {
    const problem = { id: 5, messages: [{ id: 1 }], grade_opinions: [] }
    mutations.getProblemDetails().onSuccess(problem)

    const { key, next } = patched(profileWith([{ id: 5, likeCount: 2, wallid: 3 }]))
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([{ id: 5, likeCount: 2, wallid: 3, messages: [{ id: 1 }], grade_opinions: [] }])
  })

  // The old action unconditionally committed `{...state.problems, [problem.id]: merged}`
  // even when the problem was not already in the map — upserting it in, not
  // skipping (unlike reportProblem's explicit guard).
  it('inserts the problem when it is not already in the cached array', () => {
    const problem = { id: 777, name: 'Not in the list yet' }
    mutations.getProblemDetails().onSuccess(problem)

    const { next } = patched(profileWith([{ id: 5 }]))
    expect(next.gym.problems).toEqual([{ id: 5 }, problem])
  })

  it('does nothing when the response has no problem', () => {
    mutations.getProblemDetails().onSuccess(null)

    expect(queryClient.setQueryData).not.toHaveBeenCalled()
  })
})

describe('mutations.deleteProject', () => {
  it('calls api.deleteProject with the bare (pretick) id', async () => {
    api.deleteProject.mockResolvedValue({ message: 'ok', problem: { id: 5 } })

    await mutations.deleteProject().mutationFn(123)

    expect(api.deleteProject).toHaveBeenCalledWith(123)
  })

  it('resolves with the full response, so callers can read resp.message', async () => {
    api.deleteProject.mockResolvedValue({ message: 'Pretick removed', problem: { id: 5 } })

    const ret = await mutations.deleteProject().mutationFn(123)

    expect(ret).toEqual({ message: 'Pretick removed', problem: { id: 5 } })
  })

  // Ported verbatim from store.js's deleteProject action: the cache entry is
  // REPLACED wholesale with ret.problem, not merged with whatever was there.
  it('replaces the matching problem wholesale with ret.problem', () => {
    mutations.deleteProject().onSuccess({ message: 'ok', problem: { id: 5, myProjects: [] } })

    const { key, next } = patched(profileWith([{ id: 5, myProjects: [{ id: 123 }], likeCount: 2 }]))
    expect(key).toEqual(['profile', 42])
    expect(next.gym.problems).toEqual([{ id: 5, myProjects: [] }])
  })

  it('invalidates newProblems, matching the old action', () => {
    mutations.deleteProject().onSuccess({ message: 'ok', problem: { id: 5 } })

    const keys = queryClient.invalidateQueries.mock.calls.map(([{ queryKey }]) => queryKey[0])
    expect(keys).toEqual(['new-problems'])
  })
})

/**
 * Type-consistency check (per Task 3's post-mortem): every current caller of
 * likeProblem/dislikeProblem/commentProblem/reportProblem/getProblemDetails
 * reaches this via a fetched problem's own `.id` (a Number, from JSON) —
 * never a raw route param — so there is no second, differently-typed id
 * source the way Task 3's compid had two (a route param string vs. a
 * fetched object's numeric id). These mutations still compare with `==`
 * rather than `===` when locating the row in the cached array, matching the
 * old Vuex `state.problems[pid]` lookup's behavior: JS object-key lookup
 * always coerces the key to a string, so a string pid and a numeric `.id`
 * found the same entry there regardless of which the caller passed. `==`
 * reproduces that tolerance for the new array-based lookup.
 */
describe('id comparison tolerates a string id against a numeric problem.id (matches the old object-key lookup)', () => {
  it('likeProblem', () => {
    mutations.likeProblem().onSuccess({ likeCount: 9, dislikeCount: 0 }, '5')

    const { next } = patched(profileWith([{ id: 5, likeCount: 1, dislikeCount: 0 }]))
    expect(next.gym.problems[0].likeCount).toBe(9)
  })
})
