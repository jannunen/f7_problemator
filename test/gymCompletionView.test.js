import { describe, it, expect } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import en from '../src/js/i18n/locales/en.json'
import fi from '../src/js/i18n/locales/fi.json'
import GymCompletion from '../src/components/gym_completion/GymCompletion.vue'

// No DOM in this test setup: the component is server-rendered and the HTML
// inspected. The numbers themselves are covered in gymCompletion.test.js.
const grades = [
  { id: 1, name: '5', score: 300 },
  { id: 2, name: '5+', score: 350 },
  { id: 3, name: '6a', score: 400 },
]
const problem = (id, gradeId, over = {}) => ({
  id,
  routetype: 'boulder',
  tag: 'TPL2026' + id,
  colour: { name: 'Red', code: '#e11d48' },
  wall: { wallchar: 'B', walldesc: 'Cave' },
  grade: grades.find((g) => g.id === gradeId),
  ...over,
})
// 5: two of two climbed. 5+: one of three. 6a: untouched.
const problems = [problem(11, 1), problem(12, 1), problem(21, 2), problem(22, 2), problem(23, 2), problem(31, 3)]
const ticks = [{ problemid: 11 }, { problemid: 12 }, { problemid: 21 }]

const render = async (props, locale = 'en') => {
  const app = createSSRApp({ render: () => h(GymCompletion, { grades, problems, ticks, gymName: 'Boulder Barn', ...props }) })
  app.use(createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, fi } }))
  return renderToString(app)
}
const count = (html, needle) => html.split(needle).length - 1

describe('GymCompletion', () => {
  it('leads with the share climbed, the count behind it and the gym it is for', async () => {
    const html = await render()
    expect(html).toContain('Boulder Barn')
    expect(html).toMatch(/gc-hero__figure[^>]*>50</)
    expect(html).toContain('3 of 6 climbed')
  })

  it('points at the grade closest to cleared', async () => {
    const html = await render()
    expect(html).toContain('data-test="gym-completion-next"')
    expect(html).toContain('2 more to clear grade 5+')
    expect(html).toContain('1 of 3 climbed')
  })

  it('uses the singular when one problem is left', async () => {
    const html = await render({ ticks: [...ticks, { problemid: 22 }] })
    expect(html).toContain('1 more to clear grade 5+')
  })

  it('gives every grade a row a screen reader can read without the bar', async () => {
    const html = await render()
    expect(count(html, 'class="gc-rows__item"')).toBe(3)
    expect(html).toContain('5: 2 of 2 climbed')
    expect(html).toContain('5+: 1 of 3 climbed')
    expect(html).toContain('6a: 0 of 1 climbed')
  })

  it('makes only the grades with something left expandable', async () => {
    const html = await render()
    // 5 is cleared: a check, not a button.
    expect(count(html, 'aria-expanded="false"')).toBe(2)
    expect(count(html, 'gc-row__check')).toBe(1)
    // Nothing is open until a row is tapped.
    expect(html).not.toContain('gc-problem')
  })

  it('celebrates instead of pointing anywhere once everything is climbed', async () => {
    const html = await render({ ticks: problems.map((p) => ({ problemid: p.id })) })
    expect(html).toContain('data-test="gym-completion-all-climbed"')
    expect(html).not.toContain('data-test="gym-completion-next"')
    expect(html).toMatch(/gc-hero__figure[^>]*>100</)
  })

  it('explains an empty gym instead of drawing an empty chart', async () => {
    const html = await render({ problems: [] })
    expect(html).toContain('data-test="gym-completion-empty"')
    expect(html).toContain('Nothing is set in this gym right now')
    // The filter stays, so a gym with boulders but no routes is one tap away.
    expect(count(html, 'p-toggle-group__btn')).toBeGreaterThanOrEqual(3)
  })

  it('shows a skeleton, not a 0%, while the data is on its way', async () => {
    const html = await render({ loading: true })
    expect(html).toContain('data-test="gym-completion-loading"')
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('gc-hero__figure')
  })

  it('renders in Finnish', async () => {
    const html = await render({}, 'fi')
    expect(html).toContain('3 / 6 kiivetty')
    expect(html).toContain('Greidi 5+: enää 2 jäljellä')
    expect(html).toContain('Greideittäin')
  })
})
