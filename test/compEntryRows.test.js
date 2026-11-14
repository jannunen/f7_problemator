import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
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
const CheckpointLadder = (await import('../src/components/comps/CheckpointLadder.vue')).default
const PButton = (await import('../src/components/PButton.vue')).default

// A stub that keeps its props/attrs visible as attributes and renders every
// slot. onRender (optional) receives what the slots rendered.
const stub = (name, onRender) => ({
  name,
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => {
      const children = Object.values(slots).map((s) => s())
      if (onRender) onRender(children)
      return h('div', { 'data-stub': name, ...attrs }, children)
    }
  },
})
const F7 = ['f7-popup', 'f7-page', 'f7-navbar', 'f7-nav-right', 'f7-link', 'f7-block', 'f7-block-title',
  'f7-list', 'f7-list-item', 'f7-swipeout-actions', 'f7-swipeout-button', 'f7-stepper']

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

const render = async (Component, comp, locale = 'en', { actions = {}, onRow = null } = {}) => {
  const store = createStore({
    state: () => ({ competition: comp, climber: { id: 5, point_entry_key: 'k' }, compResults: null, alltime: { ticks: [] } }),
    actions: { getCompResults: () => null, publicGetCompResults: () => null, getPointsPerRoute: () => null, publicGetPointsPerRoute: () => null, ...actions },
  })
  const app = createSSRApp({ render: () => h(Component, { comp }) })
  app.use(store)
  // missingWarn: the sport row's placeholder is the untranslated literal t('Enter points').
  app.use(createI18n({ legacy: false, locale, fallbackLocale: 'en', messages, missingWarn: false }))
  F7.forEach((n) => app.component(n, stub(n, n === 'f7-list-item' ? onRow : null)))
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

  it.each(['fixed_points_best_n', 'variable_points', 'predefined_plus_flashcomp'])('every tries stepper has min 1 (%s)', async (tyyppi) => {
    const html = await render(Component, makeComp(tyyppi))
    const steppers = count(html, 'data-stub="f7-stepper"')
    expect(steppers).toBeGreaterThan(0)
    expect(count(html, 'min="1"')).toBe(steppers)
  })

  it('ifsc_2024_bouldering renders a ladder per problem, not steppers', async () => {
    const html = await render(Component, makeComp('ifsc_2024_bouldering'))
    expect(count(html, 'data-stub="f7-stepper"')).toBe(0)
    expect(count(html, 'data-test="ladder"')).toBe(2)
    expect(html).toContain('Low zone')
    expect(html).toContain('High zone')
  })

  it('a ladder beside a Save button gets the row to itself (the buttons go under it)', async () => {
    const ifsc = await render(Component, makeComp('ifsc_2024_bouldering'))
    expect(count(ifsc, 'comp-row--ladder ') + count(ifsc, 'comp-row--ladder"')).toBe(2)
    expect(count(ifsc, 'comp-row--ladder-stacked')).toBe(ifsc.includes('>Save</button>') ? 2 : 0)
    // the signed-in checkpoint row has no Save button; the public one does
    const checkpoints = await render(Component, makeComp('checkpoint_points'))
    expect(count(checkpoints, 'comp-row--ladder ') + count(checkpoints, 'comp-row--ladder"')).toBe(2)
    expect(count(checkpoints, 'comp-row--ladder-stacked')).toBe(checkpoints.includes('>Save</button>') ? 2 : 0)
    // other comp types keep the ordinary row
    expect(await render(Component, makeComp('fixed_points_best_n'))).not.toContain('comp-row--ladder')
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

// No DOM to click: each list row's rendered vnodes are kept, and a test calls
// the handlers the template wired onto the ladder / input / Save button.
const walk = (nodes, out = []) => {
  for (const n of [nodes].flat(Infinity)) {
    if (n == null || typeof n !== 'object') continue
    out.push(n)
    if (Array.isArray(n.children)) walk(n.children, out)
  }
  return out
}
const renderLive = async (comp) => {
  const rows = []
  // Like the real actions: a saved tick lands in userticks, a checkpoint answers like the backend.
  const saveTick = vi.fn(async ({ state }, p) => {
    state.competition.userticks = { ...state.competition.userticks, [p.problemid]: { problemid: p.problemid, tries: p.tries, tries_bonus: p.tries_bonus } }
    return { new_badges: [] }
  })
  const saveCheckpoint = vi.fn(async (_ctx, p) => ({ ok: true, applied: true, checkpoint: p.checkpoint, attempts: p.attempts ?? 0, zone_tries: p.zone_tries ?? {} }))
  const deleteTickByProblem = vi.fn(async () => ({ message: 'ok' }))
  const html = await render(CompetitionEntry, comp, 'en', { actions: { saveTick, saveCheckpoint, deleteTickByProblem }, onRow: (vnodes) => rows.push(vnodes) })
  const ladder = (pid) => walk(rows).find((n) => n.type === CheckpointLadder && n.props?.problem?.id === pid).props
  // Rows that have a problem in them, in the page's order (problem 1, problem 2).
  const problemRows = rows.filter((r) => walk(r).some((n) => n.type === PButton || n.type === CheckpointLadder))
  const input = (i) => walk(problemRows[i]).find((n) => n.type === 'input').props
  const saveButton = (i) => walk(problemRows[i]).find((n) => n.type === PButton).props
  return { html, ladder, input, saveButton, saveTick, saveCheckpoint }
}
const sportComp = () => ({
  ...makeComp('sport'),
  problems: [1, 2].map((n) => ({ ...problem(n, n), pivot: { num: n, max_points: 100, bind_to_category: 1 } })),
  paidregistrations: [{ id: 5, pivot: { serieid: 1 } }],
})
const ADDITIVE_TYPES = ['ifsc_2018_bouldering', 'traditional', 'flashcomp']
const RUNG_TYPES = ['ifsc_2024_bouldering', ...ADDITIVE_TYPES]

describe('CompetitionEntry: partial credit vs a genuine top', () => {
  it.each(ADDITIVE_TYPES)('%s renders a Bonus + Top ladder per problem, not the stepper pair', async (tyyppi) => {
    const html = await render(CompetitionEntry, makeComp(tyyppi))
    expect(count(html, 'data-stub="f7-stepper"')).toBe(0)
    expect(count(html, 'data-test="ladder"')).toBe(2)
    expect(count(html, 'data-test="rung-1"')).toBe(2)
    expect(html).not.toContain('data-test="rung-2"')
    expect(html).toContain('Bonus')
  })

  it.each(RUNG_TYPES)('%s has no Save button and no trash, even when ticked', async (tyyppi) => {
    const html = await render(CompetitionEntry, makeComp(tyyppi, ticked))
    expect(html).not.toContain('>Save</button>')
    expect(html).not.toContain('data-test="delete-ascent"')
    expect(html).toContain('Swipe left to delete an ascent')
  })

  it.each(['traditional', 'ifsc_2018_bouldering'])('%s shows the fixed bonus and top points', async (tyyppi) => {
    const html = await render(CompetitionEntry, makeComp(tyyppi))
    expect(html).toContain('aria-label="Bonus, 3 points, trying now, 0 tries so far"')
    expect(html).toContain('aria-label="Top, 25 points, not reached"')
  })

  it('flashcomp shows no points on its rungs (they depend on the tries), rather than a 0', async () => {
    const html = await render(CompetitionEntry, makeComp('flashcomp'))
    expect(html).not.toContain('ladder__points')
    expect(html).toContain('aria-label="Bonus, trying now, 0 tries so far"')
    expect(html).toContain('aria-label="Top, not reached"')
  })

  it('the old ifsc_2024_bouldering zone ladder plumbing is gone', () => {
    const src = readFileSync(new URL('../src/components/comps/CompetitionEntry.vue', import.meta.url), 'utf8')
    expect(src).not.toMatch(/zoneLadderFor|setZoneLadderState|onZoneLadderAction|zoneLadders|helpers\/zoneLadder/)
  })

  it.each(RUNG_TYPES)('tapping Top on a %s ladder saves a real tick for that problem', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    await live.ladder(2).onTop()
    expect(live.saveTick).toHaveBeenCalledTimes(1)
    expect(live.saveTick.mock.calls[0][1]).toMatchObject({ problemid: 2, tries: 1, ticktype: 'tick' })
  })

  it.each(RUNG_TYPES)('reaching only the first %s rung saves a checkpoint, never a tick', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onReached()
    await vi.waitFor(() => expect(live.saveCheckpoint).toHaveBeenCalled(), { timeout: 2000 })
    expect(live.saveCheckpoint.mock.calls.at(-1)[1]).toMatchObject({ compid: 9, problemid: 1, checkpoint: 1 })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it.each(ADDITIVE_TYPES)('%s: a Top tapped directly carries tries_bonus = tries', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][1]).toMatchObject({ problemid: 1, tries: 2, tries_bonus: 2 })
  })

  it.each(ADDITIVE_TYPES)('%s: a Top after the bonus carries the bonus tries', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onReached()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][1]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
  })

  it.each(ADDITIVE_TYPES)('%s: correcting the bonus after a Top saves the tick again', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onTry()
    await l.onTop()
    l.onEdit(1, 2)
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(2), { timeout: 2000 })
    expect(live.saveTick.mock.calls[1][1]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
  })

  it('ifsc_2024_bouldering: the top tick keeps its old tries_bonus, and a zone correction does not save it again', async () => {
    const live = await renderLive(makeComp('ifsc_2024_bouldering'))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][1]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 0 })
    l.onEdit(1, 2)
    await vi.waitFor(() => expect(live.saveCheckpoint.mock.calls.some((c) => c[1].replace)).toBe(true), { timeout: 2000 })
    expect(live.saveTick).toHaveBeenCalledTimes(1)
  })

  it('sport keeps its points field', async () => {
    const html = await render(CompetitionEntry, sportComp())
    expect(count(html, 'placeholder="Enter points"')).toBe(2)
    expect(count(html, '>Save</button>')).toBe(2)
  })

  it('sport: saving a height below the top saves the score, not a tick', async () => {
    const live = await renderLive(sportComp())
    live.input(0).onChange({ target: { value: '25.5' } })
    await live.saveButton(0).onClick()
    await vi.waitFor(() => expect(live.saveCheckpoint).toHaveBeenCalledTimes(1))
    expect(live.saveCheckpoint.mock.calls[0][1]).toEqual({ compid: 9, problemid: 1, score: 25.5 })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it('sport: saving the top (1000) saves a real tick', async () => {
    const live = await renderLive(sportComp())
    live.input(1).onChange({ target: { value: '1000' } })
    live.saveButton(1).onClick()
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1))
    expect(live.saveTick.mock.calls[0][1]).toMatchObject({ problemid: 2, sport_points: '1000' })
    expect(live.saveCheckpoint).not.toHaveBeenCalled()
  })
})
