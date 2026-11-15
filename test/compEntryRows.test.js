import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'fs'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { VueQueryPlugin } from '@tanstack/vue-query'
import messages from '../src/js/i18n/messages.js'
import { useClimberStore } from '../src/js/stores/climber.store.js'
import { pinia } from '../src/js/stores/index.js'

// No DOM in this test setup: the entry components are server-rendered with
// Framework7's components stubbed, and the HTML inspected.
// The helpers barrel pulls in auth/browser-only code; the rows only need
// right() from it. The api module needs real functions now too: saveCheckpoint/
// deleteCheckpoint/getCompResults/getPointsPerRoute/saveTick/
// deleteTickByProblem/ranking all go through mutations.js/queryKeys.js
// (real, unmocked, so their own onSuccess cache patches and queryFn bodies
// run for real) rather than through a Vuex dispatch stand-in, as
// saveTick/deleteTickByProblem used to before Task 5 of the Activity-group
// migration plan moved them off Vuex too. `ranking` is mocked only because
// saveTick/publicSaveTick's real onSuccess calls useRankingsStore(pinia).
// fetchRankings(), which would otherwise hit this unmocked endpoint.
vi.mock('@js/helpers', async () => ({ right: (await import('../src/js/helpers/utils.js')).right, handleValidationErrors: () => '' }))
vi.mock('@js/api.js', () => ({
  webendpoint: '',
  endpoint: '',
  default: {
    getCompResults: vi.fn().mockResolvedValue(null),
    getPointsPerRoute: vi.fn().mockResolvedValue({}),
    saveCheckpoint: vi.fn(),
    deleteCheckpoint: vi.fn().mockResolvedValue({ ok: true }),
    saveTick: vi.fn(),
    deleteTickByProblem: vi.fn(),
    ranking: vi.fn().mockResolvedValue({}),
  },
}))
vi.mock('framework7-vue', () => ({ f7: { dialog: { confirm: vi.fn() }, notification: { create: () => ({ open() {} }) } } }))

import api from '@js/api.js'
import { queryClient } from '@js/queryClient'

const CompetitionEntry = (await import('../src/components/comps/CompetitionEntry.vue')).default
const PublicCompetitionEntry = (await import('../src/components/comps/PublicCompetitionEntry.vue')).default
const CheckpointLadder = (await import('../src/components/comps/CheckpointLadder.vue')).default
const PButton = (await import('../src/components/PButton.vue')).default

// climber moved off Vuex (this plan's Task 1): CompetitionEntry.vue and
// PublicCompetitionEntry.vue now read it from the Pinia climber store via a
// bare useClimberStore(), which resolves against whatever Pinia considers
// "active". Seeding it once here, through the real shared `pinia` instance,
// both supplies the point_entry_key the public rows below need and — as a
// side effect of passing that instance explicitly — makes it Pinia's active
// instance for the bare calls inside the rendered components.
useClimberStore(pinia).setFromProfile({ id: 5, point_entry_key: 'k' })

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

const render = async (Component, comp, locale = 'en', { onRow = null } = {}) => {
  // The real app-wide singleton (matching app.js's own
  // app.use(VueQueryPlugin, { queryClient }) installation), not a fresh
  // instance: mutations.js's saveCheckpoint/deleteCheckpoint/
  // getPointsPerRoute/saveTick/deleteTickByProblem onSuccess all import and
  // write to this exact singleton directly (not through Vue's
  // provide/inject), so a fresh instance here would never see their
  // writes. Cleared (not just overwritten) per render so unrelated test
  // cases don't leak into each other, then re-seeded with this render's own
  // `comp` under the key the real SingleCompetitionPage.vue/
  // PublicSingleCompetitionPage.vue would cache it under.
  const queryKeyName = Component === PublicCompetitionEntry ? 'public-competition' : 'competition'
  queryClient.clear()
  queryClient.setQueryData([queryKeyName, comp.id], comp)
  const app = createSSRApp({ render: () => h(Component, { comp }) })
  app.use(VueQueryPlugin, { queryClient })
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
const renderLive = async (comp, { Component = CompetitionEntry } = {}) => {
  const rows = []
  // There is no real DOM here to re-render after a cache patch (this is a
  // single renderToString pass; see render() above), so `comp` itself —
  // the exact object handed to the component as its `comp` prop — is
  // mutated directly here, standing in for what a live useQuery observer
  // bound to `props.comp` would have re-rendered the component with once
  // mutations.saveTick/deleteTickByProblem's REAL onSuccess (exercised for
  // real below, via the mocked api.saveTick/api.deleteTickByProblem) patched
  // the ['competition'|'public-competition', compid] query cache.
  // useCheckpointLadders.js's `comp()?.userticks` (comp is a getter,
  // `() => props.comp`) reads this live on every call — e.g. to decide undo
  // vs top on a ladder's next action — so without this the ladder would
  // keep acting on stale userticks for the rest of this render.
  const patchUserticks = (tick) => {
    comp.userticks = { ...comp.userticks, [tick.problemid]: tick }
  }
  const removeUsertick = (problemid) => {
    const rest = { ...comp.userticks }
    delete rest[problemid]
    comp.userticks = rest
  }
  api.saveTick.mockReset()
  api.deleteTickByProblem.mockReset()
  // Mirrors what the real endpoint returns: {problem, tick, new_badges}.
  // Only a real tick (ticktype 'tick') lands in userticks — a try/project
  // never does, matching mutations.saveTick's own ticktype branch.
  api.saveTick.mockImplementation(async (payload) => {
    const tick = { problemid: payload.problemid, tries: payload.tries, tries_bonus: payload.tries_bonus, sport_points: payload.sport_points }
    if (payload.ticktype === 'tick') patchUserticks(tick)
    return { problem: { id: payload.problemid }, tick, new_badges: [] }
  })
  api.deleteTickByProblem.mockImplementation(async (payload) => {
    removeUsertick(payload.problemid)
    return { message: 'ok' }
  })
  const saveCheckpoint = vi.fn(async (p) => ({ ok: true, applied: true, checkpoint: p.checkpoint, attempts: p.attempts ?? 0, zone_tries: p.zone_tries ?? {} }))
  api.saveCheckpoint.mockReset()
  api.saveCheckpoint.mockImplementation((payload) => saveCheckpoint(payload))
  const html = await render(Component, comp, 'en', { onRow: (vnodes) => rows.push(vnodes) })
  const ladder = (pid) => walk(rows).find((n) => n.type === CheckpointLadder && n.props?.problem?.id === pid).props
  // Rows that have a problem in them, in the page's order (problem 1, problem 2).
  const problemRows = rows.filter((r) => walk(r).some((n) => n.type === PButton || n.type === CheckpointLadder))
  const input = (i) => walk(problemRows[i]).find((n) => n.type === 'input').props
  const saveButton = (i) => walk(problemRows[i]).find((n) => n.type === PButton).props
  return { html, ladder, input, saveButton, saveTick: api.saveTick, saveCheckpoint: api.saveCheckpoint, deleteTickByProblem: api.deleteTickByProblem }
}
const sportComp = () => ({
  ...makeComp('sport'),
  problems: [1, 2].map((n) => ({ ...problem(n, n), pivot: { num: n, max_points: 100, bind_to_category: 1 } })),
  paidregistrations: [{ id: 5, pivot: { serieid: 1 } }],
})
const ADDITIVE_TYPES = ['ifsc_2018_bouldering', 'traditional', 'flashcomp']
const RUNG_TYPES = ['ifsc_2024_bouldering', ...ADDITIVE_TYPES]

// A partial height is a checkpoint score, not a tick: it has to come back after a reload.
describe.each([['CompetitionEntry', CompetitionEntry], ['PublicCompetitionEntry', PublicCompetitionEntry]])('%s: sport field on load', (_, Component) => {
  const pointsValues = (html) => [...html.matchAll(/<input value="([^"]*)"[^>]*placeholder="Enter points"/g)].map((m) => m[1])
  const inputs = (html) => [...html.matchAll(/<input([^>]*)placeholder="Enter points"/g)].map((m) => m[1])

  it('a saved score with no tick shows in the field', async () => {
    const html = await render(Component, { ...sportComp(), my_checkpoint_scores: { 1: 25.25 } })
    expect(pointsValues(html)).toEqual(['25.25'])
    expect(inputs(html)[1]).not.toContain('value=')
  })

  it('a tick wins over a saved score', async () => {
    const comp = { ...sportComp(), userticks: { 1: { problemid: 1, tries: 1, tries_bonus: 0, sport_points: 1000 } }, my_checkpoint_scores: { 1: 25.25 } }
    const html = await render(Component, comp)
    expect(pointsValues(html)).toEqual(['TOP'])
  })

  it('neither a tick nor a score leaves the field empty', async () => {
    const html = await render(Component, { ...sportComp(), my_checkpoint_scores: {} })
    expect(inputs(html)).toHaveLength(2)
    inputs(html).forEach((attrs) => expect(attrs).not.toContain('value='))
  })
})

// Tops saved by the old stepper UI: no checkpoint row, the counts are on the tick only.
describe.each([
  ['CompetitionEntry', CompetitionEntry],
  ['PublicCompetitionEntry', PublicCompetitionEntry],
])('%s: correcting a Top saved before the ladders', (_, Component) => {
  it.each(ADDITIVE_TYPES)('%s keeps the tick\'s own tries_bonus', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi, { 1: { problemid: 1, tries: 5, tries_bonus: 2 } }), { Component })
    live.ladder(1).onEdit(2, 4)
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 4, tries_bonus: 2 })
  })

  // Unusable old zones (above the tries) are not loaded, so nothing holds the correction up.
  it('ifsc_2024_bouldering: the top tick is saved without the old zone fields', async () => {
    const legacy = { 1: { problemid: 1, tries: 5, tries_bonus: 0, attempts_low_zone: 3, attempts_high_zone: 6 } }
    const live = await renderLive(makeComp('ifsc_2024_bouldering', legacy), { Component })
    live.ladder(1).onEdit(3, 2)
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1), { timeout: 2000 })
    const payload = live.saveTick.mock.calls[0][0]
    expect(payload).toMatchObject({ problemid: 1, tries: 2 })
    expect(payload).not.toHaveProperty('attempts_low_zone')
    expect(payload).not.toHaveProperty('attempts_high_zone')
  })

  it('ifsc_2024_bouldering: a Top correction writes the old zone counts, not the corrected tries', async () => {
    const legacy = { 1: { problemid: 1, tries: 5, tries_bonus: 0, attempts_low_zone: 2, attempts_high_zone: 3 } }
    const live = await renderLive(makeComp('ifsc_2024_bouldering', legacy), { Component })
    live.ladder(1).onEdit(3, 4)
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1), { timeout: 2000 })
    expect(live.saveCheckpoint.mock.calls.at(-1)[0]).toMatchObject({ problemid: 1, checkpoint: 2, attempts: 4, zone_tries: { 1: 2, 2: 3 }, replace: true })
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 4 })
    expect(live.saveTick.mock.calls[0][0]).not.toHaveProperty('attempts_high_zone')
  })
})

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
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 2, tries: 1, ticktype: 'tick' })
    // The regression this task's review caught: a tick write used to be a
    // silent no-op on the ['competition', compid] query cache (see
    // store.tickCompetitionCache.test.js for the store-level proof of the
    // real bridge). This checks the fake action mirrors that same contract.
    expect(queryClient.getQueryData(['competition', 9]).userticks).toHaveProperty('2')
  })

  it.each(RUNG_TYPES)('reaching only the first %s rung saves a checkpoint, never a tick', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onReached()
    await vi.waitFor(() => expect(live.saveCheckpoint).toHaveBeenCalled(), { timeout: 2000 })
    expect(live.saveCheckpoint.mock.calls.at(-1)[0]).toMatchObject({ compid: 9, problemid: 1, checkpoint: 1 })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it.each(ADDITIVE_TYPES)('%s: a Top tapped directly carries tries_bonus = tries', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 2, tries_bonus: 2 })
  })

  it.each(ADDITIVE_TYPES)('%s: a Top after the bonus carries the bonus tries', async (tyyppi) => {
    const live = await renderLive(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onReached()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
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
    expect(live.saveTick.mock.calls[1][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
  })

  it('ifsc_2024_bouldering: the top tick keeps its old tries_bonus, and a zone correction does not save it again', async () => {
    const live = await renderLive(makeComp('ifsc_2024_bouldering'))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 0 })
    l.onEdit(1, 2)
    await vi.waitFor(() => expect(live.saveCheckpoint.mock.calls.some((c) => c[0].replace)).toBe(true), { timeout: 2000 })
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
    expect(live.saveCheckpoint.mock.calls[0][0]).toEqual({ compid: 9, problemid: 1, score: 25.5 })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it.each([['33+', 33.25], ['33-', 32.75], ['25,5', 25.5]])('sport: %s is saved as the score %s, as the backend parses it', async (raw, score) => {
    const live = await renderLive(sportComp())
    live.input(0).onChange({ target: { value: raw } })
    await live.saveButton(0).onClick()
    expect(live.saveCheckpoint).toHaveBeenCalledTimes(1)
    expect(live.saveCheckpoint.mock.calls[0][0]).toEqual({ compid: 9, problemid: 1, score })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it('sport: lowering a topped route deletes its tick, then saves the score', async () => {
    const comp = { ...sportComp(), userticks: { 1: { problemid: 1, tries: 1, tries_bonus: 0, sport_points: 1000 } } }
    const live = await renderLive(comp)
    live.input(0).onChange({ target: { value: '33+' } })
    await live.saveButton(0).onClick()
    expect(live.deleteTickByProblem).toHaveBeenCalledTimes(1)
    expect(live.deleteTickByProblem.mock.calls[0][0]).toMatchObject({ problemid: 1 })
    expect(live.saveCheckpoint.mock.calls[0][0]).toEqual({ compid: 9, problemid: 1, score: 33.25 })
    expect(live.deleteTickByProblem.mock.invocationCallOrder[0]).toBeLessThan(live.saveCheckpoint.mock.invocationCallOrder[0])
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it('sport: a lower height on an untopped route deletes nothing', async () => {
    const live = await renderLive(sportComp())
    live.input(0).onChange({ target: { value: '20' } })
    await live.saveButton(0).onClick()
    expect(live.deleteTickByProblem).not.toHaveBeenCalled()
  })

  it.each(['', 'abc'])('sport: Save on %j saves nothing', async (raw) => {
    const live = await renderLive(sportComp())
    live.input(0).onChange({ target: { value: raw } })
    await live.saveButton(0).onClick()
    expect(live.saveCheckpoint).not.toHaveBeenCalled()
    expect(live.saveTick).not.toHaveBeenCalled()
    expect(live.deleteTickByProblem).not.toHaveBeenCalled()
  })

  it('sport: saving the top (1000) saves a real tick', async () => {
    const live = await renderLive(sportComp())
    live.input(1).onChange({ target: { value: '1000' } })
    live.saveButton(1).onClick()
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1))
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 2, sport_points: '1000' })
    expect(live.saveCheckpoint).not.toHaveBeenCalled()
  })
})

describe('PublicCompetitionEntry: partial credit vs a genuine top', () => {
  const livePublic = (comp) => renderLive(comp, { Component: PublicCompetitionEntry })

  it.each(ADDITIVE_TYPES)('%s renders a Bonus + Top ladder per problem, not the stepper pair', async (tyyppi) => {
    const html = await render(PublicCompetitionEntry, makeComp(tyyppi))
    expect(count(html, 'data-stub="f7-stepper"')).toBe(0)
    expect(count(html, 'data-test="ladder"')).toBe(2)
    expect(count(html, 'data-test="rung-1"')).toBe(2)
    expect(html).not.toContain('data-test="rung-2"')
    expect(html).toContain('Bonus')
  })

  it.each(RUNG_TYPES)('%s has no Save button and no trash, even when ticked', async (tyyppi) => {
    const html = await render(PublicCompetitionEntry, makeComp(tyyppi, ticked))
    expect(html).not.toContain('>Save</button>')
    expect(html).not.toContain('data-test="delete-ascent"')
    expect(html).toContain('Swipe left to delete an ascent')
  })

  it('checkpoint_points keeps its read-only ladder and its Save button', async () => {
    const html = await render(PublicCompetitionEntry, makeComp('checkpoint_points'))
    expect(count(html, 'data-test="ladder"')).toBe(2)
    expect(count(html, '>Save</button>')).toBe(2)
    expect(count(html, 'comp-row--ladder-stacked')).toBe(2)
  })

  it.each(['traditional', 'ifsc_2018_bouldering'])('%s shows the fixed bonus and top points', async (tyyppi) => {
    const html = await render(PublicCompetitionEntry, makeComp(tyyppi))
    expect(html).toContain('aria-label="Bonus, 3 points, trying now, 0 tries so far"')
    expect(html).toContain('aria-label="Top, 25 points, not reached"')
  })

  it('flashcomp shows no points on its rungs (they depend on the tries), rather than a 0', async () => {
    const html = await render(PublicCompetitionEntry, makeComp('flashcomp'))
    expect(html).not.toContain('ladder__points')
    expect(html).toContain('aria-label="Bonus, trying now, 0 tries so far"')
    expect(html).toContain('aria-label="Top, not reached"')
  })

  it('the old ifsc_2024_bouldering zone ladder plumbing is gone, the read-only checkpoint ladder stays', () => {
    const src = readFileSync(new URL('../src/components/comps/PublicCompetitionEntry.vue', import.meta.url), 'utf8')
    expect(src).not.toMatch(/zoneLadderFor|setZoneLadderState|onZoneLadderAction|zoneLadders|helpers\/zoneLadder/)
    expect(src).toMatch(/:state="ladderFor\(prob\)"\s+readonly/)
  })

  it.each(RUNG_TYPES)('tapping Top on a %s ladder saves a real public tick for that problem, with the key', async (tyyppi) => {
    const live = await livePublic(makeComp(tyyppi))
    await live.ladder(2).onTop()
    expect(live.saveTick).toHaveBeenCalledTimes(1)
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 2, tries: 1, ticktype: 'tick', point_entry_key: 'k' })
    expect(queryClient.getQueryData(['public-competition', 9]).userticks).toHaveProperty('2')
  })

  it.each(RUNG_TYPES)('reaching only the first %s rung saves a public checkpoint with the key, never a tick', async (tyyppi) => {
    const live = await livePublic(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onReached()
    await vi.waitFor(() => expect(live.saveCheckpoint).toHaveBeenCalled(), { timeout: 2000 })
    expect(live.saveCheckpoint.mock.calls.at(-1)[0]).toMatchObject({ compid: 9, problemid: 1, checkpoint: 1, point_entry_key: 'k' })
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it.each(RUNG_TYPES)('undoing a %s Top deletes the public tick with the key', async (tyyppi) => {
    const live = await livePublic(makeComp(tyyppi))
    const l = live.ladder(1)
    await l.onTop()
    await live.ladder(1).onUndo()
    expect(live.deleteTickByProblem).toHaveBeenCalledTimes(1)
    expect(live.deleteTickByProblem.mock.calls[0][0]).toEqual({ problemid: 1, point_entry_key: 'k' })
  })

  it.each(ADDITIVE_TYPES)('%s: a Top after the bonus carries the bonus tries', async (tyyppi) => {
    const live = await livePublic(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onReached()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
  })

  it.each(ADDITIVE_TYPES)('%s: correcting the bonus after a Top saves the tick again', async (tyyppi) => {
    const live = await livePublic(makeComp(tyyppi))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onTry()
    await l.onTop()
    l.onEdit(1, 2)
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(2), { timeout: 2000 })
    expect(live.saveTick.mock.calls[1][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 2 })
  })

  it('ifsc_2024_bouldering: the top tick keeps its old tries_bonus, and a zone correction does not save it again', async () => {
    const live = await livePublic(makeComp('ifsc_2024_bouldering'))
    const l = live.ladder(1)
    l.onTry()
    l.onTry()
    l.onTry()
    await l.onTop()
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 1, tries: 3, tries_bonus: 0 })
    l.onEdit(1, 2)
    await vi.waitFor(() => expect(live.saveCheckpoint.mock.calls.some((c) => c[0].replace)).toBe(true), { timeout: 2000 })
    expect(live.saveTick).toHaveBeenCalledTimes(1)
  })

  it('sport keeps its points field and its Save button', async () => {
    const html = await render(PublicCompetitionEntry, sportComp())
    expect(count(html, 'placeholder="Enter points"')).toBe(2)
    expect(count(html, '>Save</button>')).toBe(2)
  })

  it.each([['25.5', 25.5], ['33+', 33.25], ['33-', 32.75], ['25,5', 25.5]])('sport: %s is saved as the public score %s with the key, not a tick', async (raw, score) => {
    const live = await livePublic(sportComp())
    live.input(0).onChange({ target: { value: raw } })
    await live.saveButton(0).onClick()
    expect(live.saveCheckpoint).toHaveBeenCalledTimes(1)
    expect(live.saveCheckpoint.mock.calls[0][0]).toEqual({ compid: 9, problemid: 1, score, point_entry_key: 'k' })
    expect(live.saveTick).not.toHaveBeenCalled()
    expect(live.deleteTickByProblem).not.toHaveBeenCalled()
  })

  it('sport: lowering a topped route deletes its public tick first, then saves the score', async () => {
    const comp = { ...sportComp(), userticks: { 1: { problemid: 1, tries: 1, tries_bonus: 0, sport_points: 1000 } } }
    const live = await livePublic(comp)
    live.input(0).onChange({ target: { value: '33+' } })
    await live.saveButton(0).onClick()
    expect(live.deleteTickByProblem.mock.calls[0][0]).toEqual({ problemid: 1, point_entry_key: 'k' })
    expect(live.saveCheckpoint.mock.calls[0][0]).toEqual({ compid: 9, problemid: 1, score: 33.25, point_entry_key: 'k' })
    expect(live.deleteTickByProblem.mock.invocationCallOrder[0]).toBeLessThan(live.saveCheckpoint.mock.invocationCallOrder[0])
    expect(live.saveTick).not.toHaveBeenCalled()
  })

  it.each(['', 'abc'])('sport: Save on %j saves nothing', async (raw) => {
    const live = await livePublic(sportComp())
    live.input(0).onChange({ target: { value: raw } })
    await live.saveButton(0).onClick()
    expect(live.saveCheckpoint).not.toHaveBeenCalled()
    expect(live.saveTick).not.toHaveBeenCalled()
    expect(live.deleteTickByProblem).not.toHaveBeenCalled()
  })

  it('sport: saving TOP saves a real public tick with the key', async () => {
    const live = await livePublic(sportComp())
    live.input(1).onChange({ target: { value: 'TOP' } })
    live.saveButton(1).onClick()
    await vi.waitFor(() => expect(live.saveTick).toHaveBeenCalledTimes(1))
    expect(live.saveTick.mock.calls[0][0]).toMatchObject({ problemid: 2, sport_points: 'TOP', point_entry_key: 'k' })
    expect(live.saveCheckpoint).not.toHaveBeenCalled()
  })
})
