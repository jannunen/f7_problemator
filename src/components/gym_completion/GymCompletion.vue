<template>
  <div class="gc" data-test="gym-completion">
    <div class="p-toggle-group gc-filter" role="group" :aria-label="t('gym.filter_label')">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        type="button"
        class="p-toggle-group__btn"
        :class="{ 'p-toggle-group__btn--active': routeType === opt.value }"
        :aria-pressed="routeType === opt.value"
        @click="routeType = opt.value"
      >{{ opt.label }}</button>
    </div>

    <div v-if="loading" class="gc-loading" aria-busy="true" data-test="gym-completion-loading">
      <span class="sr-only">{{ t('global.loading') }}</span>
      <div class="p-skeleton p-skeleton--card"></div>
      <div class="p-skeleton gc-loading__list"></div>
    </div>

    <div v-else-if="completion.total === 0" class="p-card gc-empty" data-test="gym-completion-empty">
      <span class="material-icons gc-empty__icon" aria-hidden="true">terrain</span>
      <p class="gc-empty__text">{{ t('gym.empty_' + routeType) }}</p>
    </div>

    <template v-else>
      <section class="p-card">
        <h2 v-if="gymName" class="p-card__title">{{ gymName }}</h2>

        <div class="gc-hero">
          <div class="gc-hero__figure">{{ completion.percent }}<span class="gc-hero__unit">%</span></div>
          <div class="gc-hero__count">{{ t('gym.climbed_of', { done: completion.done, total: completion.total }) }}</div>
        </div>

        <div class="gc-bar gc-bar--summary" aria-hidden="true">
          <span v-if="completion.done > 0" class="gc-bar__done" :style="{ flexGrow: completion.done }"></span>
          <span v-if="completion.left > 0" class="gc-bar__left" :style="{ flexGrow: completion.left }"></span>
        </div>

        <dl class="gc-facts">
          <div class="gc-fact">
            <dt class="gc-fact__label">{{ t('gym.to_go') }}</dt>
            <dd class="gc-fact__value">{{ completion.left }}</dd>
          </div>
          <div class="gc-fact">
            <dt class="gc-fact__label">{{ t('gym.grades_cleared') }}</dt>
            <dd class="gc-fact__value">{{ completion.cleared }}<span class="gc-fact__of">/{{ completion.gradeCount }}</span></dd>
          </div>
          <div class="gc-fact">
            <dt class="gc-fact__label">{{ t('gym.hardest_climbed') }}</dt>
            <dd class="gc-fact__value">{{ completion.hardest ? gradeLabel(completion.hardest) : '–' }}</dd>
          </div>
        </dl>
      </section>

      <div v-if="completion.left === 0" class="gc-next gc-next--done" data-test="gym-completion-all-climbed">
        <span class="material-icons gc-next__icon" aria-hidden="true">check_circle</span>
        <span class="gc-next__body">
          <span class="gc-next__title">{{ t('gym.all_climbed') }}</span>
          <span class="gc-next__sub">{{ t('gym.all_climbed_hint') }}</span>
        </span>
      </div>
      <button
        v-else-if="completion.next"
        type="button"
        class="gc-next"
        data-test="gym-completion-next"
        @click="showNext"
      >
        <span class="material-icons gc-next__icon" aria-hidden="true">flag</span>
        <span class="gc-next__body">
          <span class="gc-next__title">{{ nextTitle }}</span>
          <span class="gc-next__sub">{{ t('gym.climbed_of', { done: completion.next.row.done, total: completion.next.row.total }) }}</span>
        </span>
        <span class="material-icons gc-next__chevron" aria-hidden="true">expand_more</span>
      </button>

      <section class="p-card">
        <div class="gc-head">
          <h2 class="p-card__title gc-head__title">{{ t('gym.by_grade') }}</h2>
          <div class="gc-legend" aria-hidden="true">
            <span class="gc-legend__item"><span class="gc-legend__swatch gc-legend__swatch--done"></span>{{ t('gym.legend_climbed') }}</span>
            <span class="gc-legend__item"><span class="gc-legend__swatch gc-legend__swatch--left"></span>{{ t('gym.legend_left') }}</span>
          </div>
        </div>

        <ul class="gc-rows">
          <li v-for="row in completion.rows" :key="row.key" :ref="(el) => setRowEl(row.key, el)" class="gc-rows__item">
            <component
              :is="row.left > 0 ? 'button' : 'div'"
              class="gc-row"
              :class="{ 'gc-row--empty': row.total === 0, 'gc-row--button': row.left > 0 }"
              v-bind="row.left > 0 ? { type: 'button', 'aria-expanded': isOpen(row), 'aria-controls': 'gc-left-' + row.key } : {}"
              @click="row.left > 0 && toggle(row)"
            >
              <span class="sr-only">{{ rowLabel(row) }}</span>
              <span class="gc-row__grade" aria-hidden="true">{{ gradeLabel(row) }}</span>
              <span class="gc-row__track" aria-hidden="true">
                <span v-if="row.total > 0" class="gc-bar" :style="{ width: barWidth(row) }">
                  <span v-if="row.done > 0" class="gc-bar__done" :style="{ flexGrow: row.done }"></span>
                  <span v-if="row.left > 0" class="gc-bar__left" :style="{ flexGrow: row.left }"></span>
                </span>
              </span>
              <span class="gc-row__figure" aria-hidden="true">
                <template v-if="row.total > 0">{{ row.done }}<span class="gc-row__total">/{{ row.total }}</span></template>
                <template v-else>–</template>
              </span>
              <span class="gc-row__state" aria-hidden="true">
                <span v-if="row.total > 0 && row.left === 0" class="material-icons gc-row__check">check_circle</span>
                <span
                  v-else-if="row.left > 0"
                  class="material-icons gc-row__chevron"
                  :class="{ 'gc-row__chevron--open': isOpen(row) }"
                >expand_more</span>
              </span>
            </component>

            <ul v-if="isOpen(row)" :id="'gc-left-' + row.key" class="gc-left">
              <li v-for="item in row.remaining" :key="item.problem.id">
                <button type="button" class="gc-problem" @click="emit('open-problem', item.problem)">
                  <span
                    class="gc-problem__colour"
                    :style="{ background: item.problem.colour?.code || 'transparent' }"
                    aria-hidden="true"
                  ></span>
                  <span class="gc-problem__tag">{{ getTagShort(item.problem.tag) }}</span>
                  <span class="gc-problem__wall">{{ wallLabel(item.problem) }}</span>
                  <span v-if="item.tried" class="gc-problem__tried">{{ t('gym.tried') }}</span>
                  <span class="material-icons gc-problem__chevron" aria-hidden="true">chevron_right</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildGymCompletion, formatGradeName } from '@js/gymCompletion.js'
import { getTagShort } from '@js/helpers/utils.js'

const props = defineProps({
  grades: { type: Array, default: () => [] },
  problems: { type: Array, default: () => [] },
  ticks: { type: Array, default: () => [] },
  tries: { type: Array, default: () => [] },
  gymName: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['open-problem'])

const { t } = useI18n()

const routeType = ref('all')
const filterOptions = computed(() => [
  { value: 'all', label: t('gym.all') },
  { value: 'boulder', label: t('gym.boulder') },
  { value: 'sport', label: t('gym.sport') },
])

const completion = computed(() =>
  buildGymCompletion({
    grades: props.grades,
    problems: props.problems,
    ticks: props.ticks,
    tries: props.tries,
    routeType: routeType.value,
  })
)

const gradeLabel = (row) => (row.name == null ? t('gym.no_grade') : formatGradeName(row.name, routeType.value))

const gradeName = (row) => {
  if (row.name == null) return t('gym.ungraded')
  if (!row.rated) return t('gym.project')
  return formatGradeName(row.name, routeType.value)
}

const rowLabel = (row) =>
  row.total === 0
    ? t('gym.row_none', { grade: gradeName(row) })
    : t('gym.row_label', { grade: gradeName(row), done: row.done, total: row.total })

const nextTitle = computed(() => {
  const next = completion.value.next
  if (!next) return ''
  const grade = gradeName(next.row)
  return next.kind === 'clear'
    ? t('gym.next_clear', { n: next.row.left, grade }, next.row.left)
    : t('gym.next_start', { grade })
})

// Bar length is the number of problems set at the grade, against the busiest
// grade in view. The floor keeps a grade with a single problem visible.
const barWidth = (row) => Math.max(4, (row.total / completion.value.maxTotal) * 100) + '%'

const wallLabel = (problem) =>
  [problem.wall?.wallchar, problem.wall?.walldesc].filter(Boolean).join(' ')

const openKey = ref(null)
// A grade with nothing left has no list to show, even if it was open when the
// last problem in it got ticked.
const isOpen = (row) => openKey.value === row.key && row.left > 0
const toggle = (row) => {
  openKey.value = openKey.value === row.key ? null : row.key
}
watch(routeType, () => {
  openKey.value = null
})

const rowEls = new Map()
const setRowEl = (key, el) => {
  if (el) rowEls.set(key, el)
  else rowEls.delete(key)
}

const showNext = async () => {
  const key = completion.value.next?.row.key
  if (key == null) return
  openKey.value = key
  await nextTick()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  rowEls.get(key)?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
}
</script>

<style scoped>
.gc {
  max-width: 42rem;
  margin: 0 auto;
  padding-bottom: 0.5rem;
}

.gc-filter {
  margin: 0.75rem 1rem;
}

.gc button:focus-visible {
  outline: 2px solid var(--p-accent);
  outline-offset: 2px;
}

/* ---- Summary ---- */
.gc-hero {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
/* Proportional figures: tabular digits look loose at this size. */
.gc-hero__figure {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--p-text);
}
.gc-hero__unit {
  margin-left: 0.125rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--p-text-muted);
}
.gc-hero__count {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--p-text-secondary);
  text-align: right;
}

/* ---- The bar: climbed and left, split by a gap rather than a border ---- */
.gc-bar {
  display: flex;
  gap: 2px;
  height: 8px;
  min-width: 8px;
  transition: width var(--p-duration-slow) var(--p-ease);
}
.gc-bar__done,
.gc-bar__left {
  flex: 0 1 0;
  min-width: 3px;
  border-radius: 2px;
  transition: flex-grow var(--p-duration-slow) var(--p-ease);
}
.gc-bar__done {
  background: var(--p-success);
}
.gc-bar__left {
  background: rgba(59, 178, 115, 0.32);
}
/* Square where a bar starts, rounded where its value ends. */
.gc-bar > :last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
/* The summary bar is a whole, not a bar on an axis, so both ends round. */
.gc-bar--summary {
  margin-top: 0.875rem;
}
.gc-bar--summary > :first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.gc-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 1rem 0 0;
  padding-top: 0.875rem;
  border-top: 1px solid var(--p-border);
}
.gc-fact {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-end;
  gap: 0.125rem;
  min-width: 0;
}
.gc-fact + .gc-fact {
  padding-left: 0.75rem;
  border-left: 1px solid var(--p-border);
}
.gc-fact__value {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--p-text);
}
.gc-fact__of {
  font-weight: 600;
  color: var(--p-text-muted);
}
.gc-fact__label {
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

/* ---- Next up ---- */
.gc-next {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: calc(100% - 2rem);
  margin: 0.75rem 1rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid rgba(var(--p-accent-rgb), 0.2);
  border-radius: var(--p-radius);
  background: rgba(var(--p-accent-rgb), 0.08);
  color: var(--p-text);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--p-duration) var(--p-ease);
}
button.gc-next:active {
  background: rgba(var(--p-accent-rgb), 0.14);
}
.gc-next--done {
  border-color: rgba(59, 178, 115, 0.25);
  background: rgba(59, 178, 115, 0.1);
  cursor: default;
}
.gc-next__icon {
  flex-shrink: 0;
  font-size: 1.375rem;
  color: var(--p-accent);
}
.gc-next--done .gc-next__icon {
  color: var(--p-success);
}
.gc-next__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}
.gc-next__title {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
}
.gc-next__sub {
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--p-accent-tint);
}
.gc-next--done .gc-next__sub {
  color: #86d9ab;
}
.gc-next__chevron {
  flex-shrink: 0;
  font-size: 1.25rem;
  color: var(--p-accent-tint);
}

/* ---- By grade ---- */
.gc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
}
.gc-head__title {
  margin-bottom: 0;
}
.gc-legend {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--p-text-muted);
}
.gc-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.gc-legend__swatch {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.gc-legend__swatch--done {
  background: var(--p-success);
}
.gc-legend__swatch--left {
  background: rgba(59, 178, 115, 0.32);
}

.gc-rows,
.gc-left {
  margin: 0;
  padding: 0;
  list-style: none;
}
.gc-row {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr) auto 1.25rem;
  align-items: center;
  column-gap: 0.625rem;
  /* Bleeds half a rem into the card's padding so the pressed state has room
     around the text instead of hugging it. */
  width: calc(100% + 1rem);
  min-height: 2.5rem;
  margin: 0 -0.5rem;
  padding: 0 0.5rem;
  border: none;
  border-radius: var(--p-radius-sm);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}
.gc-row--button {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--p-duration) var(--p-ease);
}
.gc-row--button:active,
.gc-row--button[aria-expanded='true'] {
  background: var(--p-bg-card-hover);
}
.gc-row__grade {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--p-text-secondary);
}
.gc-row--empty .gc-row__grade,
.gc-row--empty .gc-row__figure {
  font-weight: 500;
  color: var(--p-text-muted);
}
.gc-row__track {
  display: flex;
  align-items: center;
}
.gc-row__figure {
  min-width: 2.75rem;
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--p-text);
  text-align: right;
}
.gc-row__total {
  font-weight: 500;
  color: var(--p-text-muted);
}
.gc-row__state {
  display: flex;
  justify-content: center;
}
.gc-row__check {
  font-size: 1rem;
  color: var(--p-success);
}
.gc-row__chevron {
  font-size: 1.125rem;
  color: var(--p-text-dim);
  transition: transform var(--p-duration) var(--p-ease);
}
.gc-row__chevron--open {
  transform: rotate(180deg);
}

/* ---- What is left at a grade ---- */
.gc-left {
  margin: 0.125rem 0 0.5rem 3.125rem;
  border-top: 1px solid var(--p-border);
}
.gc-problem {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  min-height: 2.5rem;
  padding: 0;
  border: none;
  border-bottom: 1px solid var(--p-border);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.gc-problem:active {
  background: var(--p-bg-card-hover);
}
.gc-problem__colour {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  /* The ring keeps black and dark-blue holds visible on the dark card. */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}
.gc-problem__tag {
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
  color: var(--p-text);
}
.gc-problem__wall {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 0.8125rem;
  color: var(--p-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Same amber as the "P" project badge in the problem list. */
.gc-problem__tried {
  flex-shrink: 0;
  padding: 0.0625rem 0.4375rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--p-radius-full);
  background: rgba(245, 158, 11, 0.2);
  font-size: 0.6875rem;
  font-weight: 600;
  color: #fcd34d;
}
.gc-problem__chevron {
  flex-shrink: 0;
  font-size: 1.125rem;
  color: var(--p-text-dim);
}

/* ---- Loading and empty ---- */
.gc-loading {
  margin: 0.75rem 1rem;
}
.gc-loading__list {
  height: 18rem;
  margin-top: 0.75rem;
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius-lg);
}
.gc-empty {
  padding-top: 1.75rem;
  padding-bottom: 1.75rem;
  text-align: center;
}
.gc-empty__icon {
  font-size: 2rem;
  color: var(--p-text-dim);
}
.gc-empty__text {
  max-width: 18rem;
  margin: 0.5rem auto 0;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--p-text-muted);
}

@media (hover: hover) {
  button.gc-next:hover {
    background: rgba(var(--p-accent-rgb), 0.12);
  }
  .gc-row--button:hover,
  .gc-problem:hover {
    background: var(--p-bg-card-hover);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gc-bar,
  .gc-bar__done,
  .gc-bar__left,
  .gc-row__chevron {
    transition: none;
  }
}
</style>
