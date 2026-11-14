<template>
  <div
    class="ladder"
    :class="{ 'ladder--disabled': disabled, 'ladder--topped': state && state.topped }"
    role="group"
    :aria-label="t('ladder.group_label', { route: routeName })"
    :aria-busy="loading || saving || !state ? 'true' : 'false'"
    data-test="ladder"
  >
    <div v-if="loading || !state" class="ladder__rungs" data-test="ladder-loading">
      <span class="ladder__spine ladder__spine--idle" aria-hidden="true"></span>
      <div v-for="i in 3" :key="i" class="ladder__rung ladder__rung--skeleton" aria-hidden="true">
        <span class="ladder__node"></span>
        <span class="ladder__skeleton-bar"></span>
      </div>
      <span class="ladder__sr">{{ t('ladder.loading') }}</span>
    </div>

    <template v-else>
      <!-- Climbing order in the DOM (zone 1 first) so screen readers and the
           tab order go up the route; column-reverse draws the Top at the top. -->
      <div class="ladder__rungs">
        <span class="ladder__spine" :style="spineStyle" aria-hidden="true"></span>
        <button
          v-for="row in rows"
          :key="row.rung"
          type="button"
          class="ladder__rung"
          :class="['ladder__rung--' + row.status, { 'ladder__rung--top': row.isTop }]"
          :aria-label="rungName(row)"
          :aria-current="row.status === 'active' ? 'step' : undefined"
          :aria-disabled="!canSelect(row) ? 'true' : undefined"
          :data-test="'rung-' + (row.isTop ? 'top' : row.rung)"
          @click="onRung(row)"
        >
          <span class="ladder__node" aria-hidden="true"></span>
          <span class="ladder__label">
            <span class="ladder__name">{{ rungLabel(row) }}</span>
            <span class="ladder__points">{{ rungPoints(row) }}</span>
          </span>
          <span class="ladder__mark" aria-hidden="true">
            <template v-if="row.status === 'reached'">
              <span class="ladder__check">✓</span>
              <span v-if="row.count != null" class="ladder__in">{{ t('ladder.in_tries', { n: row.count }) }}</span>
            </template>
            <template v-else-if="row.status === 'active'">
              <svg
                v-if="state.attempts > 0"
                class="ladder__tally"
                :width="tallyWidth"
                height="20"
                :viewBox="'0 0 ' + tallyWidth + ' 20'"
                data-test="tally"
              >
                <path v-for="(d, i) in tallyPaths" :key="i" :d="d" />
              </svg>
              <span v-if="state.attempts > 0" class="ladder__count" data-test="count">{{ state.attempts }}</span>
            </template>
          </span>
        </button>
      </div>

      <div v-if="!readonly && !state.topped" class="ladder__actions">
        <button
          type="button"
          class="ladder__btn ladder__btn--try"
          :disabled="disabled"
          :aria-label="t('ladder.add_try_on', { label: activeLabel })"
          data-test="add-try"
          @click="emit('try')"
        >
          {{ t('ladder.add_try') }}
        </button>
        <!-- Two different elements (own keys), not one relabelled button: after
             ✓ on the last zone the Top button takes its place, and a quick
             second tap must not land on it. It is also held for a moment. -->
        <button
          v-if="activeIsTop"
          key="top"
          type="button"
          class="ladder__btn ladder__btn--top"
          :disabled="disabled || topHeld"
          :aria-label="t('ladder.mark_top')"
          data-test="mark-top"
          @click="onTop"
        >
          {{ t('ladder.top_button') }}
        </button>
        <button
          v-else
          key="reached"
          type="button"
          class="ladder__btn ladder__btn--reached"
          :disabled="disabled"
          :aria-label="t('ladder.mark_reached', { label: activeLabel })"
          data-test="mark-reached"
          @click="onReached"
        >
          {{ t('ladder.reached_button') }}
        </button>
      </div>

      <div v-if="showFooter" class="ladder__footer">
        <button
          v-if="!readonly && !disabled && undoable"
          type="button"
          class="ladder__quiet"
          :disabled="disabled"
          data-test="undo"
          @click="emit('undo')"
        >
          {{ t('ladder.undo') }}
        </button>
        <button
          v-else-if="!readonly && !disabled && clearable"
          type="button"
          class="ladder__quiet ladder__quiet--danger"
          :disabled="disabled"
          data-test="clear"
          @click="emit('clear')"
        >
          {{ t('comps.clear_checkpoint') }}
        </button>
        <span class="ladder__status">
          <template v-if="error">
            <span class="ladder__error" role="alert" data-test="error">{{ error }}</span>
            <button
              v-if="!disabled"
              type="button"
              class="ladder__quiet ladder__quiet--retry"
              data-test="retry"
              @click="emit('retry')"
            >
              {{ t('ladder.retry') }}
            </button>
          </template>
          <span v-else-if="saving" class="ladder__saving" data-test="saving">{{ t('ladder.saving') }}</span>
          <span v-else-if="disabled && lockedReason" class="ladder__locked" data-test="locked">{{ lockedReason }}</span>
        </span>
      </div>

      <span class="ladder__sr" aria-live="polite" aria-atomic="true" data-test="live">{{ announcement }}</span>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import { DOUBLE_TAP_MS } from '@helpers/ladder.js'
import { useI18n } from 'vue-i18n'
import { checkpointOptions, checkpointDisplayLabel } from '@helpers/checkpoints.js'
import { rungView, tallyGroups, canUndo, isEmpty, isTopRung } from '@helpers/ladder.js'

/**
 * One route's zones as a ladder: Zone 1 … Top drawn upward along the route's
 * tape colour, attempts as chalk tally marks on the rung being tried. Purely
 * presentational: the parent owns the ladder state (helpers/ladder.js) and
 * the saving, and answers the events.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  state: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  // Read-only view (no actions at all), e.g. the public results entry page.
  readonly: { type: Boolean, default: false },
  lockedReason: { type: String, default: null },
  loading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  error: { type: String, default: null },
})
const emit = defineEmits(['select', 'try', 'reached', 'top', 'undo', 'retry', 'clear'])
const { t } = useI18n()

const options = computed(() => checkpointOptions(props.problem))
const rows = computed(() => (props.state ? rungView(props.state) : []))
const routeName = computed(() => [props.problem?.pivot?.num, props.problem?.tag].filter((v) => v != null && v !== '').join(' '))

const optionFor = (row) => (row.isTop ? options.value[options.value.length - 1] : options.value[row.rung - 1])
const rungLabel = (row) => checkpointDisplayLabel(options.value, row.isTop ? 'top' : row.rung, t)
const rungPoints = (row) => optionFor(row)?.points ?? 0

const activeRow = computed(() => rows.value.find((r) => r.status === 'active') ?? null)
const activeLabel = computed(() => (activeRow.value ? rungLabel(activeRow.value) : ''))
const activeIsTop = computed(() => !!props.state && props.state.active != null && isTopRung(props.state, props.state.active))

const undoable = computed(() => !!props.state && canUndo(props.state))
// No undo history (e.g. after a reload) but something saved: a quiet way to
// start the route over. A top is removed by swiping the row, as before.
const clearable = computed(() => !!props.state && !props.state.topped && !isEmpty(props.state))
const showFooter = computed(
  () => (!props.readonly && !props.disabled && (undoable.value || clearable.value)) || !!props.error || props.saving || (props.disabled && !!props.lockedReason),
)

// ✓ on the last zone turns the button into ✓ Top: hold that for a moment so
// a double tap on ✓ can never record a top.
const topHeld = ref(false)
let holdTimer = null
const onReached = () => {
  emit('reached')
  topHeld.value = true
  clearTimeout(holdTimer)
  holdTimer = setTimeout(() => {
    topHeld.value = false
  }, DOUBLE_TAP_MS)
}
const onTop = () => {
  if (!topHeld.value) emit('top')
}
onBeforeUnmount(() => clearTimeout(holdTimer))

const canSelect = (row) => !props.disabled && !props.readonly && row.status === 'idle'
const onRung = (row) => {
  if (canSelect(row)) emit('select', row.rung)
}

const rungName = (row) => {
  const named = { label: rungLabel(row), points: rungPoints(row) }
  if (row.status === 'reached') {
    if (row.count == null) return t('ladder.rung_reached_unknown', named)
    return t(row.isTop ? 'ladder.rung_topped' : 'ladder.rung_reached', { ...named, n: row.count }, row.count)
  }
  if (row.status === 'active') {
    const n = props.state.attempts
    return t('ladder.rung_active', { ...named, n }, n)
  }
  return t('ladder.rung_idle', named)
}

const announcement = computed(() => {
  const s = props.state
  if (!s) return ''
  if (s.topped) return t('ladder.live_topped', { n: s.topTries ?? s.attempts }, s.topTries ?? s.attempts)
  if (!activeRow.value) return ''
  return t('ladder.live_count', { label: activeLabel.value, n: s.attempts }, s.attempts)
})

// Chalk tally: up to three groups of five (the number beside it is the truth
// past that). Strokes lean a little, the way a hand draws them.
const TALLY_MAX_GROUPS = 3
const GROUP_W = 24
const STROKE_GAP = 4.5
const shownGroups = computed(() => tallyGroups(props.state?.attempts ?? 0).slice(-TALLY_MAX_GROUPS))
const tallyWidth = computed(() => Math.max(1, shownGroups.value.length * GROUP_W))
const tallyPaths = computed(() => {
  const paths = []
  shownGroups.value.forEach((count, g) => {
    const x0 = 4 + g * GROUP_W
    const verticals = Math.min(count, 4)
    for (let i = 0; i < verticals; i++) {
      const x = x0 + i * STROKE_GAP
      const lean = i % 2 === 0 ? 0.6 : -0.4
      paths.push(`M${x + lean},2 L${x - lean},18`)
    }
    if (count === 5) paths.push(`M${x0 - 3},15 L${x0 + 3 * STROKE_GAP + 3},5`)
  })
  return paths
})

const spineStyle = computed(() => {
  const code = props.problem?.colour?.code
  return code ? { '--ladder-tape': code } : {}
})
</script>

<style scoped>
/* Tokens: the wall's world. Graphite on a light page, chalk on the navy one. */
.ladder {
  --ladder-ink: #0f172a;
  --ladder-ink-soft: #64748b;
  --ladder-chalk: #334155;
  --ladder-idle: #94a3b8;
  --ladder-hold: rgba(15, 23, 42, 0.08);
  --ladder-hold-strong: rgba(15, 23, 42, 0.14);
  --ladder-reached: #4f46e5;
  --ladder-reached-text: #4338ca;
  --ladder-top: #15803d;
  --ladder-attempt: #f59e0b;
  --ladder-attempt-text: #b45309;
  --ladder-attempt-wash: rgba(245, 158, 11, 0.1);
  --ladder-danger: #dc2626;
  --ladder-tape: #94a3b8;
  --ladder-focus: #4f46e5;
  --ladder-paper: #fff;
  --ladder-tape-edge: rgba(15, 23, 42, 0.18);

  width: 100%;
  color: var(--ladder-ink);
  font-variant-numeric: tabular-nums;
}
html.theme-dark .ladder {
  --ladder-ink: #f1f5f9;
  --ladder-ink-soft: #94a3b8;
  --ladder-chalk: #f1f5f9;
  --ladder-idle: #475569;
  --ladder-hold: rgba(255, 255, 255, 0.06);
  --ladder-hold-strong: rgba(255, 255, 255, 0.12);
  --ladder-reached: #6366f1;
  --ladder-reached-text: #a5b4fc;
  --ladder-top: #3bb273;
  --ladder-attempt-text: #fbbf24;
  --ladder-attempt-wash: rgba(245, 158, 11, 0.08);
  --ladder-danger: #fca5a5;
  --ladder-focus: #a5b4fc;
  --ladder-paper: #0c1220;
  --ladder-tape-edge: rgba(255, 255, 255, 0.22);
}

.ladder__rungs {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}

/* The route's own tape runs up the ladder. */
.ladder__spine {
  position: absolute;
  left: 15px;
  top: 22px;
  bottom: 22px;
  width: 4px;
  border-radius: 2px;
  background: var(--ladder-tape);
  box-shadow: 0 0 0 1px var(--ladder-tape-edge);
}
.ladder__spine--idle {
  background: var(--ladder-hold-strong);
}

.ladder__rung {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 8px 0 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  text-align: left;
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.ladder__rung[aria-disabled='true'] {
  cursor: default;
}
.ladder__rung:focus-visible,
.ladder__btn:focus-visible,
.ladder__quiet:focus-visible {
  outline: 2px solid var(--ladder-focus);
  outline-offset: 2px;
}

.ladder__node {
  position: relative;
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 2px solid var(--ladder-idle);
  background: var(--ladder-paper);
  z-index: 1;
}

.ladder__label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.ladder__name {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ladder__points {
  font-size: 0.75rem;
  color: var(--ladder-ink-soft);
}

.ladder__mark {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  font-size: 0.875rem;
  font-weight: 700;
}

/* not yet */
.ladder__rung--idle .ladder__name {
  color: var(--ladder-ink-soft);
}

/* being attempted: the only amber on the screen */
.ladder__rung--active {
  background: var(--ladder-attempt-wash);
  border-color: rgba(245, 158, 11, 0.35);
}
.ladder__rung--active .ladder__node {
  border-color: var(--ladder-attempt);
  box-shadow: inset 0 0 0 3px var(--ladder-attempt-wash);
}
.ladder__rung--active .ladder__count {
  color: var(--ladder-attempt-text);
  min-width: 1.25em;
  text-align: right;
  font-size: 1rem;
}
.ladder__tally {
  color: var(--ladder-chalk);
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  fill: none;
  opacity: 0.9;
}

/* locked: nothing is being attempted, so no amber */
.ladder--disabled .ladder__rung--active {
  background: var(--ladder-hold);
  border-color: var(--ladder-hold-strong);
}
.ladder--disabled .ladder__rung--active .ladder__node {
  border-color: var(--ladder-idle);
}
.ladder--disabled .ladder__rung--active .ladder__count {
  color: var(--ladder-ink-soft);
}
.ladder__status:only-child {
  margin-left: 0;
  text-align: left;
}

/* reached */
.ladder__rung--reached .ladder__node {
  border-color: var(--ladder-reached);
  background: var(--ladder-reached);
}
.ladder__rung--reached .ladder__mark {
  color: var(--ladder-reached-text);
}
.ladder__in {
  font-weight: 600;
}
/* topped */
.ladder__rung--top.ladder__rung--reached .ladder__node {
  border-color: var(--ladder-top);
  background: var(--ladder-top);
}
.ladder__rung--top.ladder__rung--reached .ladder__mark,
.ladder__rung--top.ladder__rung--reached .ladder__name {
  color: var(--ladder-top);
}

.ladder__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.ladder__btn {
  flex: 1;
  min-height: 48px;
  border-radius: 10px;
  border: 1px solid var(--ladder-hold-strong);
  background: var(--ladder-hold);
  color: var(--ladder-ink);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.15s ease, transform 0.08s ease;
}
.ladder__btn--try {
  flex: 1.25;
}
.ladder__btn:active:not(:disabled) {
  transform: scale(0.98);
  background: var(--ladder-hold-strong);
}
.ladder__btn--reached {
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.12);
  color: var(--ladder-reached-text);
}
.ladder__btn--top {
  border-color: rgba(59, 178, 115, 0.5);
  background: rgba(59, 178, 115, 0.12);
  color: var(--ladder-top);
}
.ladder__btn:disabled,
.ladder__quiet:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ladder__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
  min-height: 44px;
}
.ladder__quiet {
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--ladder-ink-soft);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--ladder-hold-strong);
  cursor: pointer;
}
.ladder__quiet--danger {
  color: var(--ladder-danger);
}
.ladder__quiet--retry {
  color: var(--ladder-ink);
}
.ladder__status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 0.8125rem;
  color: var(--ladder-ink-soft);
  text-align: right;
}
.ladder__error {
  color: var(--ladder-danger);
}

.ladder__rung--skeleton {
  cursor: default;
}
.ladder__skeleton-bar {
  height: 10px;
  width: 40%;
  border-radius: 4px;
  background: var(--ladder-hold-strong);
}

.ladder__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ladder__rung,
  .ladder__btn {
    transition: none;
  }
  .ladder__btn:active:not(:disabled) {
    transform: none;
  }
}
</style>
