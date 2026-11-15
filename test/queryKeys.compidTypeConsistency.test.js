import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, createSSRApp, ref } from 'vue'
import { QueryClient, VueQueryPlugin, useQuery } from '@tanstack/vue-query'

vi.mock('@js/api', () => ({
  default: { getCompetition: vi.fn() },
}))

import api from '@js/api'
import { queries } from '@js/queryKeys'
import { asCompId } from '@js/queryKeyNames'
import { setAuthToken } from '@js/authToken.js'

// Runs a composable inside an app context, so useQuery finds the client —
// same helper test/useProfileSlice.test.js uses.
const inApp = (client, fn) => {
  let out
  const app = createSSRApp({ render: () => null })
  app.use(VueQueryPlugin, { queryClient: client })
  app.runWithContext(() => effectScope().run(() => (out = fn())))
  return out
}

beforeEach(() => {
  api.getCompetition.mockReset()
  setAuthToken(null)
})
afterEach(() => setAuthToken(null))

/**
 * Regression coverage for a real bug shipped in this migration's own
 * Task 3 commit (5e33602) and caught on re-review: `compid` arrives as a
 * STRING everywhere a page reads it off a Framework7 route param (a
 * component prop — routers never coerce types) but as a NUMBER everywhere
 * a mutation writes back into the same cache entry (an already-fetched
 * competition object's own `.id`, from JSON). TanStack's cache key hashing
 * (`hashKey` in @tanstack/query-core) is a plain JSON.stringify with no
 * type coercion, so `['competition', '7']` and `['competition', 7]` are
 * two different cache entries for the one competition — the exact
 * "virtually none of this task's optimistic cache updates are visible on a
 * real routed page" bug the re-review described.
 *
 * A second, related bug this also covers: several of this task's own
 * query factory call sites pass a bare getter function (`() =>
 * props.compid`), not a ref/computed — `unref` (used throughout
 * queryKeys.js before this fix) never calls a function, only a Ref, so a
 * bare `unref(theGetter)` inside a queryFn returns the function itself,
 * not its value. `asCompId`/`toValue` fix this too.
 */
describe('asCompId', () => {
  it('resolves a string, a number, a ref, and a getter function to the same Number', () => {
    expect(asCompId('7')).toBe(7)
    expect(asCompId(7)).toBe(7)
    expect(asCompId(ref('7'))).toBe(7)
    expect(asCompId(() => '7')).toBe(7)
    expect(asCompId(() => 7)).toBe(7)
  })

  it('leaves a nullish compid nullish, rather than coercing it to 0', () => {
    expect(asCompId(null)).toBe(null)
    expect(asCompId(undefined)).toBe(undefined)
    expect(asCompId(() => null)).toBe(null)
  })
})

describe('why this matters: TanStack hashes query keys with a plain JSON.stringify', () => {
  it('a string and a number compid hash to different keys without normalization', () => {
    expect(JSON.stringify(['competition', '7'])).not.toBe(JSON.stringify(['competition', 7]))
  })

  it('the same two hash identically once both go through asCompId', () => {
    expect(JSON.stringify(['competition', asCompId('7')])).toBe(JSON.stringify(['competition', asCompId(7)]))
  })

  it('WITHOUT normalization, writing both would create two cache entries for one competition (the bug this fixes)', () => {
    const client = new QueryClient()
    client.setQueryData(['competition', '7'], { fromQuery: true })
    client.setQueryData(['competition', 7], { fromMutation: true })

    expect(client.getQueryCache().getAll()).toHaveLength(2)
    expect(client.getQueryData(['competition', '7'])).toEqual({ fromQuery: true })
    expect(client.getQueryData(['competition', 7])).toEqual({ fromMutation: true })
  })
})

describe('queries.competition end-to-end: a route-param string and a mutation-side Number share one cache entry', () => {
  it('a mutation-shaped Number-keyed setQueryData patch is visible to a query built from a string-returning getter', async () => {
    api.getCompetition.mockResolvedValue({ id: 7, name: 'Test comp' })
    setAuthToken('a.real.jwt')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // Simulates SingleCompetitionPage.vue exactly: props.compid is a
    // Framework7 route param, read through a bare getter — always a
    // string at runtime, despite the prop's declared `Number` type (Vue
    // prop types are dev-warning-only, never coercing).
    const compidProp = ref('7')
    const query = inApp(client, () => useQuery(queries.competition(() => compidProp.value)))

    await vi.waitFor(() => expect(query.data.value).toEqual({ id: 7, name: 'Test comp' }))

    // Simulates mutations.saveCheckpoint's onSuccess exactly:
    // queryClient.setQueryData(['competition', asCompId(payload.compid)], ...)
    // where payload.compid is a Number off the fetched competition's own
    // `.id` (CompetitionEntry.vue's props.comp.id).
    client.setQueryData(['competition', asCompId(7)], (old) => ({ ...old, patched: true }))

    expect(query.data.value).toMatchObject({ patched: true })
    // Exactly one cache entry for this competition, not two.
    expect(client.getQueryCache().getAll()).toHaveLength(1)
  })

  it('api.getCompetition is called with the resolved Number, not the raw getter function', async () => {
    api.getCompetition.mockResolvedValue({ id: 7 })
    setAuthToken('a.real.jwt')
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const compidProp = ref('7')

    inApp(client, () => useQuery(queries.competition(() => compidProp.value)))

    await vi.waitFor(() => expect(api.getCompetition).toHaveBeenCalled())
    expect(api.getCompetition).toHaveBeenCalledWith({ compid: 7 })
  })
})
