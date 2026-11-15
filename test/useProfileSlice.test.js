import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h, effectScope, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import messages from '../src/js/i18n/messages.js'

// queries.profile's queryFn pulls in the api client and the still-live Vuex
// store; neither is reached here (no token, so the query never runs), but
// importing them for real drags in browser-only code.
vi.mock('@js/api', () => ({ default: { getProfile: vi.fn() } }))
vi.mock('../src/js/store.js', () => ({ default: { commit: vi.fn() } }))
vi.mock('@/js/helpers', async () => ({ calculatePoints: (await import('../src/js/helpers/problemator.js')).calculatePoints }))
vi.mock('framework7-vue', () => ({ f7: { views: { main: { router: { navigate() {} } } } } }))
vi.mock('@components/gym_completion/CompletionBarChart.vue', () => ({ default: { render: () => h('div', 'chart') } }))

const { useProfileSlice, useProfileGrades, useProfileGym } = await import('../src/js/useProfileSlice.js')
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
})

describe('components render with no profile data yet', () => {
  const render = async (Component, state = {}) => {
    const store = createStore({
      state: () => ({ alltime: { ticks: [], tries: [] }, problems: {}, ...state }),
    })
    const app = createSSRApp({ render: () => h(Component) })
    app.use(store)
    app.use(createPinia())
    app.use(VueQueryPlugin, { queryClient: new QueryClient() })
    app.use(createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages, missingWarn: false, fallbackWarn: false }))
    ;['f7-page', 'f7-navbar', 'f7-nav-left', 'f7-link', 'f7-nav-title', 'f7-block'].forEach((n) => app.component(n, stub(n)))
    app.config.warnHandler = () => {}
    return renderToString(app)
  }

  it('GymCompletionPage (grades.value.forEach during render)', async () => {
    const html = await render(GymCompletionPage)
    expect(html).toContain('chart')
  })

  it('ScoreToday with a tick today (grades.value.find during render)', async () => {
    const tick = { tstamp: new Date().toISOString(), gradeid: 3, routetype: 'boulder', tries: 1 }
    const html = await render(ScoreToday, { alltime: { ticks: [tick], tries: [] } })
    expect(html).toContain('score-today__block')
  })
})
