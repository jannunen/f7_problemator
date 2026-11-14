import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { createStore } from 'vuex'
import messages from '../src/js/i18n/messages.js'

// No DOM in this test setup: the entry components are server-rendered with
// Framework7's components stubbed, and the HTML inspected.
// The helpers barrel and the api module pull in auth/browser-only code; the
// rows only need right() and webendpoint from them.
vi.mock('@js/helpers', async () => ({ right: (await import('../src/js/helpers/utils.js')).right, handleValidationErrors: () => '' }))
vi.mock('@js/api.js', () => ({ webendpoint: '', endpoint: '' }))
vi.mock('framework7-vue', () => ({ f7: { dialog: { confirm: vi.fn() }, notification: { create: () => ({ open() {} }) } } }))

const CompetitionEntry = (await import('../src/components/comps/CompetitionEntry.vue')).default
const PublicCompetitionEntry = (await import('../src/components/comps/PublicCompetitionEntry.vue')).default

// A stub that keeps its props/attrs visible as attributes and renders every slot.
const stub = (name) => ({
  name,
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('div', { 'data-stub': name, ...attrs }, Object.values(slots).map((s) => s()))
  },
})
const F7 = ['f7-popup', 'f7-page', 'f7-navbar', 'f7-nav-right', 'f7-link', 'f7-block', 'f7-block-title',
  'f7-list', 'f7-list-item', 'f7-swipeout-actions', 'f7-swipeout-button', 'f7-stepper', 'check-point-row']

const problem = (id, num) => ({ id, tag: `B00${num}`, colour: { code: '#e11d48', textcolor: '#fff' }, pivot: { num, max_points: 100 } })
const makeComp = (tyyppi, userticks = {}) => ({
  id: 9,
  tyyppi,
  name: 'Test comp',
  timespan_start: null,
  timespan_end: null,
  userticks,
  problems: [problem(1, 1), problem(2, 2)],
  categories: [],
  paidregistrations: [],
  judges: [],
  nbest: 3,
})

const render = async (Component, comp, locale = 'en') => {
  const store = createStore({
    state: () => ({ competition: comp, climber: { id: 5, point_entry_key: 'k' }, compResults: null, alltime: { ticks: [] } }),
    actions: { getCompResults: () => null, publicGetCompResults: () => null, getPointsPerRoute: () => null, publicGetPointsPerRoute: () => null },
  })
  const app = createSSRApp({ render: () => h(Component, { comp }) })
  app.use(store)
  app.use(createI18n({ legacy: false, locale, fallbackLocale: 'en', messages }))
  F7.forEach((n) => app.component(n, stub(n)))
  app.config.warnHandler = () => {}
  // drop Vue's SSR fragment/slot markers so the HTML reads plainly
  return (await renderToString(app)).replace(/<!--.*?-->/g, '')
}
const count = (html, needle) => html.split(needle).length - 1
const ticked = { 1: { problemid: 1, tries: 0, tries_bonus: 0 } }

beforeAll(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }))
afterAll(() => vi.useRealTimers())

describe.each([['CompetitionEntry', CompetitionEntry], ['PublicCompetitionEntry', PublicCompetitionEntry]])('%s rows', (_, Component) => {
  it('the button says Save, translated', async () => {
    const en = await render(Component, makeComp('fixed_points_best_n'))
    expect(en).toContain('>Save</button>')
    expect(en).not.toMatch(/>\s*tick\s*</)
    const fi = await render(Component, makeComp('fixed_points_best_n'), 'fi')
    expect(fi).toContain('>Tallenna</button>')
  })

  it.each(['fixed_points_best_n', 'variable_points', 'ifsc_2024_bouldering', 'ifsc_2018_bouldering'])('every tries stepper has min 1 (%s)', async (tyyppi) => {
    const html = await render(Component, makeComp(tyyppi))
    const steppers = count(html, 'data-stub="f7-stepper"')
    expect(steppers).toBeGreaterThan(0)
    expect(count(html, 'min="1"')).toBe(steppers)
  })

  it('an old tick stored with 0 tries shows 1 in the stepper', async () => {
    const html = await render(Component, makeComp('fixed_points_best_n', ticked))
    expect(html).not.toContain('value="0"')
  })

  it('trash only on ticked rows, with an accessible name and the new hint', async () => {
    const html = await render(Component, makeComp('fixed_points_best_n', ticked))
    expect(count(html, 'data-test="delete-ascent"')).toBe(1)
    expect(html).toContain('aria-label="Delete ascent"')
    expect(html).toContain('>trash</i>')
    expect(html).toContain('Swipe left, or tap the trash can, to delete an ascent')
    // swipe delete is still there for every route
    expect(count(html, 'data-stub="f7-swipeout-button"')).toBe(2)
  })

  it('no trash when nothing is ticked', async () => {
    const html = await render(Component, makeComp('fixed_points_best_n'))
    expect(html).not.toContain('data-test="delete-ascent"')
  })

  it('no trash on checkpoint comps, even when ticked', async () => {
    const html = await render(Component, makeComp('checkpoint_points', ticked))
    expect(html).not.toContain('data-test="delete-ascent"')
    expect(html).toContain('Swipe left to delete an ascent')
  })
})
