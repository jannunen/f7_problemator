import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import en from '../src/js/i18n/locales/en.json'
import messages from '../src/js/i18n/messages.js'
import CheckpointLadder from '../src/components/comps/CheckpointLadder.vue'
import { fromServer, addTry, markReached, selectRung, top } from '../src/js/helpers/ladder.js'

// No DOM in this test setup: the component is server-rendered and the HTML
// inspected. Interaction lives in helpers/ladder.js and useCheckpointLadders.js,
// which have their own tests.
const problem = {
  id: 7,
  tag: 'B002',
  colour: { code: '#e11d48' },
  pivot: { num: 2, max_points: 25, checkpoints: [{ points: 10, label: 'Zone A' }, { points: 15, label: 'Zone B' }] },
}

const render = async (props) => {
  const app = createSSRApp({ render: () => h(CheckpointLadder, { problem, ...props }) })
  app.use(createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en } }))
  return renderToString(app)
}
const count = (html, needle) => html.split(needle).length - 1

describe('CheckpointLadder', () => {
  it('shows a loading ladder until there is a state', async () => {
    const html = await render({ state: null })
    expect(html).toContain('data-test="ladder-loading"')
    expect(html).toContain('Loading zones')
    expect(html).toContain('aria-busy="true"')
  })

  it('empty route: Zone A active, no tally, + try and ✓ reached, no undo', async () => {
    const html = await render({ state: fromServer({ zones: 2 }) })
    expect(html).toContain('aria-label="Zone A, 10 points, trying now, 0 tries so far"')
    expect(html).toContain('aria-label="Zone B, 15 points, not reached"')
    expect(html).toContain('aria-label="Top, 25 points, not reached"')
    expect(html).not.toContain('data-test="tally"')
    expect(html).toContain('aria-label="Add a try on Zone A"')
    expect(html).toContain('aria-label="Mark Zone A reached"')
    expect(html).not.toContain('data-test="undo"')
    expect(html).not.toContain('data-test="clear"')
    // the spine carries the route tape colour
    expect(html).toContain('--ladder-tape:#e11d48')
  })

  it('in progress: chalk tally grouped by five, count and a live announcement', async () => {
    let s = fromServer({ zones: 2 })
    for (let i = 0; i < 7; i++) s = addTry(s)
    const html = await render({ state: s })
    expect(count(html, '<path')).toBe(4 + 1 + 2) // one full group (4 + the cross) and two strokes
    expect(html).toMatch(/data-test="count"[^>]*>7</)
    expect(html).toContain('Zone A: 7 tries')
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('data-test="undo"')
  })

  it('reached zone shows its frozen tally and names it for screen readers', async () => {
    const s = markReached(addTry(addTry(fromServer({ zones: 2 }))))
    const html = await render({ state: s })
    expect(html).toContain('aria-label="Zone A, 10 points, reached in 2 tries"')
    expect(html).toContain('in 2')
    expect(html).toContain('aria-label="Zone B, 15 points, trying now, 2 tries so far"')
  })

  it('a flash reads "1 try"', async () => {
    const html = await render({ state: markReached(fromServer({ zones: 2 })) })
    expect(html).toContain('aria-label="Zone A, 10 points, reached in 1 try"')
  })

  it('old data without counts shows reached rungs with no count and offers Clear', async () => {
    const html = await render({ state: fromServer({ zones: 2, checkpoint: 1 }) })
    expect(html).toContain('aria-label="Zone A, 10 points, reached"')
    expect(html).not.toContain('>in ')
    expect(html).toContain('data-test="clear"')
  })

  it('Top active: the ✓ button becomes ✓ Top', async () => {
    const html = await render({ state: selectRung(fromServer({ zones: 2 }), 3) })
    expect(html).toContain('aria-label="Mark the top reached"')
    expect(html).toContain('✓ Top')
    // the Top ✓ is its own element, not the zone ✓ relabelled
    expect(html).toContain('data-test="mark-top"')
    expect(html).not.toContain('data-test="mark-reached"')
  })

  it('topped: green Top with tries, no action buttons, undo still there', async () => {
    const html = await render({ state: top(addTry(addTry(addTry(fromServer({ zones: 2 }))))) })
    expect(html).toContain('aria-label="Top, 25 points, topped in 3 tries"')
    expect(html).not.toContain('data-test="add-try"')
    expect(html).toContain('data-test="undo"')
    expect(html).toContain('Topped in 3 tries')
  })

  it('locked: actions disabled with the reason, rungs not selectable', async () => {
    const html = await render({ state: addTry(fromServer({ zones: 2 })), disabled: true, lockedReason: 'The competition is locked.' })
    expect(html).toMatch(/data-test="add-try"[^>]*disabled|disabled[^>]*data-test="add-try"/)
    expect(html).toContain('The competition is locked.')
    expect(html).not.toContain('data-test="retry"')
    expect(count(html, 'aria-disabled="true"')).toBe(3)
  })

  it('saving and failed states', async () => {
    const s = addTry(fromServer({ zones: 2 }))
    expect(await render({ state: s, saving: true })).toContain('Saving…')
    const failed = await render({ state: s, error: 'Not saved.' })
    expect(failed).toContain('role="alert"')
    expect(failed).toContain('data-test="retry"')
  })

  it('read-only: no actions, no undo or clear', async () => {
    const html = await render({ state: markReached(fromServer({ zones: 2 })), readonly: true })
    expect(html).not.toContain('data-test="add-try"')
    expect(html).not.toContain('data-test="undo"')
    expect(html).not.toContain('data-test="clear"')
  })

  it('uses the numbered fallback for unlabeled checkpoints', async () => {
    const app = createSSRApp({
      render: () => h(CheckpointLadder, { problem: { ...problem, pivot: { ...problem.pivot, checkpoints: [{ points: 5 }] } }, state: fromServer({ zones: 1 }) }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    expect(await renderToString(app)).toContain('Checkpoint 1')
  })
})

describe('ladder strings', () => {
  it('every locale has the same ladder keys as English, and the same plural shape', () => {
    const keys = Object.keys(en.ladder)
    for (const [lang, m] of Object.entries(messages)) {
      expect(Object.keys(m.ladder ?? {}), lang).toEqual(keys)
      for (const k of keys) {
        expect(m.ladder[k].split(' | ').length, `${lang}.${k}`).toBe(en.ladder[k].split(' | ').length)
        for (const p of en.ladder[k].match(/\{\w+\}/g) ?? []) {
          if (p === '{n}' && /\| /.test(en.ladder[k])) continue // the singular form may spell out 1
          expect(m.ladder[k], `${lang}.${k} keeps ${p}`).toContain(p)
        }
      }
    }
  })
})
