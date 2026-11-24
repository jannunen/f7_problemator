import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h, effectScope, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import messages from '../src/js/i18n/messages.js'

// queries.profile's queryFn pulls in the api client; it is never reached
// here (no token, so the query never runs), but importing it for real drags
// in browser-only code.
vi.mock('@js/api', () => ({ default: { getProfile: vi.fn() } }))
vi.mock('@/js/helpers', async () => ({ calculatePoints: (await import('../src/js/helpers/problemator.js')).calculatePoints }))
vi.mock('framework7-vue', () => ({ f7: { views: { main: { router: { navigate() {} } } } } }))
vi.mock('@components/gym_completion/CompletionBarChart.vue', () => ({ default: { render: () => h('div', 'chart') } }))

const { useProfileSlice, useProfileGrades, useProfileGym, useProfileProblems } = await import('../src/js/useProfileSlice.js')
const GymCompletionPage = (await import('../src/pages/GymCompletionPage.vue')).default
const ScoreToday = (await import('../src/components/home/ScoreToday.vue')).default

const stub = (name) => ({
  name,
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => h('div', { 'data-stub': name }, Object.values(slots).map((s) => s()))
  },
})

/**
 * TanStack never runs `select` while `data` is undefined — cold start, or
 * just after a gym switch before the new gym's payload lands. The old Vuex
 * defaults (`grades: []`, `gym: { problems: [] }`...) are what these
 * components were written against; without them they threw during render.
 */
describe('useProfileSlice', () => {
  // Runs a composable inside an app context, so useQuery finds the client.
  const inApp = (client, fn) => {
    let out
    const app = createSSRApp({ render: () => null })
    app.use(VueQueryPlugin, { queryClient: client })
    app.runWithContext(() => effectScope().run(() => (out = fn())))
    return out
  }

  it('returns the fallback while the profile query has no data', () => {
    // No token in the test env, so queries.profile is disabled: data stays
    // undefined, exactly as on a cold start.
    const client = new QueryClient()
    const run = (fn) => inApp(client, fn)
    const grades = run(() => useProfileGrades(ref(1)))
    const gym = run(() => useProfileGym(ref(1)))

    expect(grades.value).toEqual([])
    expect(gym.value).toEqual({ problems: [] })
  })

  it('returns the selected slice once data is cached, and the fallback when the payload lacks it', () => {
    const client = new QueryClient()
    client.setQueryData(['profile', 1], { grades: [{ id: 1, name: '6A' }], gym: null })
    const run = (fn) => inApp(client, fn)

    expect(run(() => useProfileGrades(ref(1))).value).toEqual([{ id: 1, name: '6A' }])
    expect(run(() => useProfileSlice(ref(1), (d) => d.gym?.walls, [])).value).toEqual([])
  })

  /**
   * `problems` is not a pure server cache — it's a `select` slice of the
   * SAME profile payload, reshaped from the raw `gym.problems` ARRAY the
   * backend returns into an id-keyed OBJECT, matching exactly what the old
   * Vuex `store.commit('problems', ...)` bridge produced
   * (`acc[prob.id] = prob`). Every current consumer (ExpiringProblemsAlert,
   * AttributeRadar, GymCompletionPage, ProblemList, GymMapPage) destructures
   * this with `Object.keys`/`Object.values`/bracket-by-id lookups, not
   * array methods — so the id-keyed shape, not the raw array, is what must
   * come out of this selector.
   */
  describe('useProfileProblems', () => {
    it('returns an empty object while the profile query has no data', () => {
      const client = new QueryClient()
      const problems = inApp(client, () => useProfileProblems(ref(1)))

      expect(problems.value).toEqual({})
    })

    it('reshapes gym.problems (an array) into an id-keyed object', () => {
      const client = new QueryClient()
      client.setQueryData(['profile', 1], {
        gym: { problems: [{ id: 5, name: 'a' }, { id: 9, name: 'b' }] },
      })
      const problems = inApp(client, () => useProfileProblems(ref(1)))

      expect(problems.value).toEqual({
        5: { id: 5, name: 'a' },
        9: { id: 9, name: 'b' },
      })
    })

    it('falls back to an empty object when the payload has no gym', () => {
      const client = new QueryClient()
      client.setQueryData(['profile', 1], { gym: null })
      const problems = inApp(client, () => useProfileProblems(ref(1)))

      expect(problems.value).toEqual({})
    })
  })
})

describe('components render with no profile data yet', () => {
  // Neither component reads Vuex any more (GymCompletionPage/ScoreToday
  // both moved their alltime-ticks read to useAllTimeTicks.js, this plan's
  // Task 5) — seeding goes into the ['alltime-ticks'] TanStack cache
  // instead of a fake Vuex store's state.alltime. The cache is read
  // regardless of queries.allTimeTicks's own isAuthenticated gate (there is
  // no token in this test env, so the query itself never runs) — the same
  // "seed the cache directly" pattern queryKeys.profile.test.js's render
  // tests use.
  const render = async (Component, { ticks = [], tries = [] } = {}) => {
    const client = new QueryClient()
    client.setQueryData(['alltime-ticks'], { ticks, tries })
    const app = createSSRApp({ render: () => h(Component) })
    app.use(createPinia())
    app.use(VueQueryPlugin, { queryClient: client })
    app.use(createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages, missingWarn: false, fallbackWarn: false }))
    ;['f7-page', 'f7-navbar', 'f7-nav-left', 'f7-link', 'f7-nav-title', 'f7-block'].forEach((n) => app.component(n, stub(n)))
    app.config.warnHandler = () => {}
    return renderToString(app)
  }

  it('GymCompletionPage (grades.value.forEach during render)', async () => {
    const html = await render(GymCompletionPage)
    expect(html).toContain('data-test="gym-completion"')
  })

  it('ScoreToday with a tick today (grades.value.find during render)', async () => {
    const tick = { tstamp: new Date().toISOString(), gradeid: 3, routetype: 'boulder', tries: 1 }
    const html = await render(ScoreToday, { ticks: [tick] })
    expect(html).toContain('score-today__block')
  })
})
