import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createI18n } from 'vue-i18n'
import { VueQueryPlugin } from '@tanstack/vue-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import en from '../src/js/i18n/locales/en.json'
import fi from '../src/js/i18n/locales/fi.json'

dayjs.extend(utc)

// No DOM in this test setup: the page is server-rendered with Framework7's
// components stubbed, and the HTML inspected. Which standing and which
// registration line a competition gets is covered in compListing.test.js.
vi.mock('@js/api', () => ({ default: { getUpcomingCompetitions: vi.fn(() => new Promise(() => {})) } }))

import { queryClient } from '@js/queryClient'
const UpcomingCompetitionsPage = (await import('../src/pages/UpcomingCompetitionsPage.vue')).default

const stub = (name) => ({
  name,
  inheritAttrs: false,
  setup: (_, { attrs, slots }) => () => h('div', { 'data-stub': name, ...attrs }, slots.default?.()),
})
const F7 = ['f7-page', 'f7-navbar', 'f7-nav-left', 'f7-nav-title', 'f7-link']

const at = (days) => dayjs.utc().add(days, 'day').format('YYYY-MM-DD HH:mm:ss')
const comp = (over = {}) => ({
  id: 4200,
  name: 'Comp',
  location: 'Boulder Barn',
  compdate: at(6),
  registration_start: at(-5),
  registration_end: at(3),
  maxcontenders: 0,
  paidregistrations_count: 12,
  participates: false,
  participatesunpaid: false,
  ...over,
})

const render = async (upcoming, locale = 'en') => {
  queryClient.clear()
  if (upcoming) queryClient.setQueryData(['competitions'], { upcoming, ongoing: [], past: [] })
  const app = createSSRApp({ render: () => h(UpcomingCompetitionsPage) })
  app.use(VueQueryPlugin, { queryClient })
  app.use(createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, fi } }))
  F7.forEach((n) => app.component(n, stub(n)))
  return (await renderToString(app)).replace(/<!--.*?-->/g, '')
}
const count = (html, needle) => html.split(needle).length - 1

beforeAll(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }))
afterAll(() => vi.useRealTimers())

describe('UpcomingCompetitionsPage', () => {
  it('one linked row per competition, with its name, date and place', async () => {
    const html = await render([comp({ id: 4217, name: 'Autumn Boulder Jam' }), comp({ id: 4218, name: 'Friday Night Flash', location: null })])
    expect(count(html, 'data-test="comp-list-item"')).toBe(2)
    expect(html).toContain('href="/competitions/4217"')
    expect(html).toContain('Autumn Boulder Jam')
    expect(count(html, 'Boulder Barn')).toBe(1)
    expect(count(html, '>place</i>')).toBe(1)
  })

  it('does not show the competition id', async () => {
    const html = await render([comp({ id: 4217 })])
    expect(html.replace('href="/competitions/4217"', '')).not.toContain('4217')
  })

  it('says where I stand, by icon as well as by wording', async () => {
    const html = await render([
      comp({ id: 1, participates: { id: 9 } }),
      comp({ id: 2, participatesunpaid: { id: 9 } }),
      comp({ id: 3, maxcontenders: 10, paidregistrations_count: 10 }),
      comp({ id: 4 }),
    ])
    expect(html).toContain('>check_circle</i>You are registered!')
    expect(html).toContain('>error_outline</i>You have registered, but not paid.')
    expect(html).toContain('>block</i>Full')
    expect(html).toContain('>person_add</i>Not registered (yet)')
    expect(html).toContain('cl-item--registered')
    expect(html).toContain('cl-item--unpaid')
  })

  it('open registration: when it ends and how long that is, said once', async () => {
    const html = await render([comp()])
    expect(html).toContain('Registration ends')
    expect(html).toMatch(/cl-reg__soon[^>]*>in 3 days</)
    expect(html).not.toContain('in in ')
  })

  it('open registration with no end has nothing to count down to', async () => {
    const html = await render([comp({ registration_start: null, registration_end: null })])
    expect(html).toContain('Registration is open')
    expect(html).not.toContain('cl-reg__soon')
  })

  it('registration that has not opened yet says when it does', async () => {
    const html = await render([comp({ registration_start: at(2), registration_end: at(4) })])
    expect(html).toContain('Registration opens')
    expect(html).not.toContain('data-test="comp-standing"')
  })

  it('registration that is over says so', async () => {
    const html = await render([comp({ registration_start: at(-9), registration_end: at(-2) })])
    expect(html).toContain('Registration has closed')
    expect(html).not.toContain('Not registered')
  })

  it('a full competition drops the registration dates', async () => {
    const html = await render([comp({ maxcontenders: 10, paidregistrations_count: 10 })])
    expect(html).not.toContain('data-test="comp-registration"')
  })

  it('shows placeholders, not an empty list, until the competitions arrive', async () => {
    const html = await render(null)
    expect(html).toContain('data-test="comp-list-loading"')
    expect(html).not.toContain('data-test="comp-list-empty"')
  })

  it('an empty list says so and points at the past competitions', async () => {
    const html = await render([])
    expect(html).toContain('data-test="comp-list-empty"')
    expect(html).toContain('No active competitions right now')
    expect(html).toContain('href="/competitions/past"')
  })

  it('is translated', async () => {
    const html = await render([comp({ participates: { id: 9 } })], 'fi')
    expect(html).toContain('Olet ilmoittautunut!')
    expect(html).toContain('Ilmoittautuminen päättyy')
  })
})
