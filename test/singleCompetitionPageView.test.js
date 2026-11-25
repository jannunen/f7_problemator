import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { VueQueryPlugin } from '@tanstack/vue-query'
import messages from '../src/js/i18n/messages.js'
import { useClimberStore } from '../src/js/stores/climber.store.js'
import { pinia } from '../src/js/stores/index.js'

// No DOM in this test setup: the page is server-rendered with Framework7's
// components stubbed, and the HTML inspected. Same mocks as
// compEntryRows.test.js, which covers the scoring rows themselves.
vi.mock('@js/helpers', async () => ({ right: (await import('../src/js/helpers/utils.js')).right, handleValidationErrors: () => '' }))
vi.mock('@js/api.js', () => ({
  webendpoint: '',
  endpoint: '',
  default: { getCompetition: vi.fn(() => new Promise(() => {})), getCompResults: vi.fn().mockResolvedValue(null) },
}))
// The register view reaches the auth store, whose social sign-in helper needs a window.
vi.mock('@helpers/socialAuth.js', () => ({ signInWith: vi.fn(), clearSupabaseSession: vi.fn() }))
vi.mock('framework7-vue', () => ({ f7: { dialog: { confirm: vi.fn() }, notification: { create: () => ({ open() {} }) } } }))

import { queryClient } from '@js/queryClient'
const SingleCompetitionPage = (await import('../src/pages/SingleCompetitionPage.vue')).default

useClimberStore(pinia).setFromProfile({ id: 5, point_entry_key: 'k' })

const stub = (name) => ({
  name,
  inheritAttrs: false,
  setup: (_, { attrs, slots }) => () => h('div', { 'data-stub': name, ...attrs }, Object.values(slots).map((s) => s())),
})
const F7 = ['f7-popup', 'f7-page', 'f7-navbar', 'f7-nav-left', 'f7-nav-right', 'f7-nav-title', 'f7-link', 'f7-block',
  'f7-list', 'f7-list-item', 'f7-swipeout-actions', 'f7-swipeout-button', 'f7-stepper',
  'f7-toolbar', 'f7-tabs', 'f7-tab']

const makeComp = (over = {}) => ({
  id: 9,
  tyyppi: 'fixed_points_best_n',
  name: 'Test comp',
  timespan_start: null,
  timespan_end: null,
  userticks: {},
  problems: [],
  categories: [],
  paidregistrations: [{ id: 5, pivot: { serieid: 1 } }],
  unpaidregistrations: [],
  judges: [],
  ...over,
})

const render = async (comp) => {
  queryClient.clear()
  if (comp) queryClient.setQueryData(['competition', 9], comp)
  const app = createSSRApp({ render: () => h(SingleCompetitionPage, { compid: 9 }) })
  app.use(VueQueryPlugin, { queryClient })
  app.use(createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages, missingWarn: false }))
  F7.forEach((n) => app.component(n, stub(n)))
  app.config.warnHandler = () => {}
  return (await renderToString(app)).replace(/<!--.*?-->/g, '')
}
const count = (html, needle) => html.split(needle).length - 1

beforeAll(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }))
afterAll(() => vi.useRealTimers())

describe('SingleCompetitionPage', () => {
  it('a judge who is also competing gets the judging sheet link once', async () => {
    const html = await render(makeComp({ judges: [{ id: 5 }] }))
    expect(count(html, 'href="/competitions/9/judging"')).toBe(1)
    expect(count(html, 'Open judging sheet')).toBe(1)
    expect(count(html, 'You are a judge in this competition')).toBe(1)
  })

  it('a judge who has not registered gets it too, above the registration', async () => {
    const html = await render(makeComp({ judges: [{ id: 5 }], paidregistrations: [] }))
    expect(count(html, 'href="/competitions/9/judging"')).toBe(1)
    expect(html).toContain('Categories')
    expect(html.indexOf('data-test="comp-judge"')).toBeLessThan(html.indexOf('Categories'))
  })

  it('nobody else sees it, and a competition without a judges list does not break the page', async () => {
    expect(await render(makeComp({ judges: [{ id: 6 }] }))).not.toContain('judging')
    expect(await render(makeComp({ judges: null }))).toContain('Test comp')
  })

  it('an id the backend does not know: says so instead of breaking', async () => {
    const html = await render({ error: true, message: 'Competition not found' })
    expect(html).toContain('data-test="comp-not-found"')
    expect(html).toContain('This competition could not be found.')
  })

  it('shows a placeholder while the competition is on its way', async () => {
    const html = await render(null)
    expect(html).toContain('data-test="comp-loading"')
  })
})

// The register view: what a climber who is not (yet) a confirmed participant sees.
describe('SingleCompetitionPage: categories to register in', () => {
  const far = '2999-01-01 00:00:00'
  const category = (over = {}) => ({ id: 1, nimi: 'Open', participants: [], unpaidparticipants: 0, ...over, pivot: { price: '15', maxparticipants: null, ...over.pivot } })
  const unregistered = (cat, over = {}) => makeComp({ paidregistrations: [], registration_end: far, categories: [cat], ...over })
  const confirmed = (n) => Array.from({ length: n }, (_, i) => ({ contenderid: 100 + i }))

  it('a cap of 0 is no limit, as the backend reads it, not "0 spots left"', async () => {
    const html = await render(unregistered(category({ pivot: { maxparticipants: 0 } })))
    expect(html).toContain('No limit')
    expect(html).not.toContain('spots left')
    expect(html).toContain('Register')
  })

  it('counts the spots left against the cap on the pivot', async () => {
    const html = await render(unregistered(category({ participants: confirmed(3), unpaidparticipants: 1, pivot: { maxparticipants: 10 } })))
    expect(html).toContain('6 spots left')
    expect(html).toContain('Register')
  })

  it('a category at its cap is full: said, and no Register button', async () => {
    const html = await render(unregistered(category({ participants: confirmed(2), pivot: { maxparticipants: 2 } })))
    expect(html).toContain('chip--full')
    expect(html).toContain('FULL')
    expect(html).not.toContain('cat__register')
    expect(html).toContain('cat--shut')
  })

  it('my own unconfirmed registration comes before "full": I can still resign', async () => {
    const comp = unregistered(category({ participants: confirmed(2), pivot: { maxparticipants: 2 } }), { unpaidregistrations: [{ id: 5, pivot: { serieid: 1 } }] })
    const html = await render(comp)
    expect(html).toContain('Registered, unpaid')
    expect(html).toContain('Resign')
    expect(html).not.toContain('chip--full')
    expect(html).not.toContain('cat--shut')
  })
})
