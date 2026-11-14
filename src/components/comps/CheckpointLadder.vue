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
      <div class="ladder__rungs" :style="spineStyle">
        <div
          v-for="row in rows"
          :key="row.rung"
          class="ladder__step"
          :class="{ 'ladder__step--open': openRung === row.rung }"
        >
          <button
            type="button"
            class="ladder__rung"
            :class="['ladder__rung--' + row.status, { 'ladder__rung--top': row.isTop, 'ladder__rung--editable': canEditRow(row) }]"
            :aria-label="rungName(row)"
            :aria-current="row.status === 'active' ? 'step' : undefined"
            :aria-disabled="!canSelect(row) && !canEditRow(row) ? 'true' : undefined"
            :aria-expanded="canEditRow(row) ? (openRung === row.rung ? 'true' : 'false') : undefined"
            :data-test="'rung-' + (row.isTop ? 'top' : row.rung)"
            @click="onRung(row)"
          >
            <!-- Node and label stay together on the first line; the mark
                 drops to a line of its own when the row is too narrow. -->
            <span class="ladder__head">
              <span class="ladder__node" aria-hidden="true"></span>
              <span class="ladder__label">
                <span class="ladder__name">{{ rungLabel(row) }}</span>
                <span v-if="rungPoints(row) != null" class="ladder__points">{{ rungPoints(row) }}</span>
              </span>
            </span>
            <span v-if="row.status === 'reached' || (row.status === 'active' && state.attempts > 0)" class="ladder__mark" aria-hidden="true">
              <template v-if="row.status === 'reached'">
                <span class="ladder__check">✓</span>
                <span v-if="row.count != null" class="ladder__in">{{ t('ladder.in_tries', { n: row.count }) }}</span>
                <svg v-if="canEditRow(row)" class="ladder__pencil" width="14" height="14" viewBox="0 0 16 16" data-test="editable">
                  <path d="M2.5 13.5 3.2 10.6 10.9 2.9a1.2 1.2 0 0 1 1.7 0l.5.5a1.2 1.2 0 0 1 0 1.7L5.4 12.8Z M9.8 4 12 6.2" />
                </svg>
              </template>
              <template v-else>
                <svg
                  class="ladder__tally"
                  :width="tallyWidth"
                  height="20"
                  :viewBox="'0 0 ' + tallyWidth + ' 20'"
                  data-test="tally"
                >
                  <path v-for="(d, i) in tallyPaths" :key="i" :d="d" />
                </svg>
                <span class="ladder__count" data-test="count">{{ state.attempts }}</span>
              </template>
            </span>
          </button>

          <!-- Correcting a reached rung: the count it was reached at, or the mark itself. -->
          <div
            v-if="openRung === row.rung"
            class="ladder__edit"
            :class="{ 'ladder__edit--top': row.isTop }"
            role="group"
            :aria-label="t('ladder.edit_rung', { label: rungLabel(row) })"
            data-test="edit"
          >
            <div class="ladder__stepper">
              <button
                type="button"
                class="ladder__nudge"
                :disabled="!canNudge(row, -1)"
                :aria-label="t('ladder.fewer_tries')"
                data-test="edit-fewer"
                @click="nudge(row, -1)"
              >
                −
              </button>
              <span class="ladder__edit-count" aria-live="polite" data-test="edit-count">{{ row.count == null ? '–' : t('ladder.in_tries', { n: row.count }) }}</span>
              <button
                type="button"
                class="ladder__nudge"
                :disabled="!canNudge(row, 1)"
                :aria-label="t('ladder.more_tries')"
                data-test="edit-more"
                @click="nudge(row, 1)"
              >
                +
              </button>
            </div>
            <button type="button" class="ladder__quiet ladder__quiet--danger" data-test="unreach" @click="onUnreach(row)">
              {{ t(removesAbove(row) ? 'ladder.remove_mark_above' : 'ladder.remove_mark') }}
            </button>
            <button type="button" class="ladder__quiet ladder__edit-done" data-test="edit-done" @click="editing = null">
              {{ t('ladder.edit_done') }}
            </button>
          </div>
        </div>
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
          {{ t(props.clearLabelKey) }}
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
import { rungView, tallyGroups, canUndo, isEmpty, isTopRung, canEdit, countBounds, marksAbove } from '@helpers/ladder.js'

/**
 * One route's zones as a ladder: Zone 1 … Top drawn upward along the route's
 * tape colour, attempts as chalk tally marks on the rung being tried. Purely
 * presentational: the parent owns the ladder state (helpers/ladder.js) and
 * the saving, and answers the events. The only thing kept here is which
 * reached rung has its editor open.
 *
 * Tapping a reached rung opens its editor: − / + emit `edit` (rung, count)
 * with the corrected count, Remove emits `unreach` (rung).
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
  // Rung labels/points for a non-checkpoint ladder (e.g. ifsc_2024_bouldering's
  // fixed low/high/top), same shape as checkpointOptions' return value.
  // Defaults to the routesetter-configured checkpoints when not given.
  options: { type: Array, default: null },
  clearLabelKey: { type: String, default: 'comps.clear_checkpoint' },
})
const emit = defineEmits(['select', 'try', 'reached', 'top', 'undo', 'retry', 'clear', 'edit', 'unreach'])
const { t } = useI18n()

const options = computed(() => props.options ?? checkpointOptions(props.problem))
const rows = computed(() => (props.state ? rungView(props.state) : []))
const routeName = computed(() => [props.problem?.pivot?.num, props.problem?.tag].filter((v) => v != null && v !== '').join(' '))

const optionFor = (row) => (row.isTop ? options.value[options.value.length - 1] : options.value[row.rung - 1])
const rungLabel = (row) => checkpointDisplayLabel(options.value, row.isTop ? 'top' : row.rung, t)
// An option with points: null has no fixed value (it depends on the tries), so none is shown.
const rungPoints = (row) => {
  const points = optionFor(row)?.points
  return points === null ? null : points ?? 0
}

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

// Correcting a reached rung. The editor closes by itself when its rung stops
// being editable (the mark was removed, undone, or the ladder got locked).
const editing = ref(null)
const editable = computed(() => !props.disabled && !props.readonly && !!props.state)
const canEditRow = (row) => editable.value && canEdit(props.state, row.rung)
const openRung = computed(() => (editing.value != null && editable.value && canEdit(props.state, editing.value) ? editing.value : null))
const removesAbove = (row) => marksAbove(props.state, row.rung) > 0
// A count that is not known yet (old data) starts from the lowest it can be.
const nudged = (row, step) => {
  const bounds = countBounds(props.state, row.rung)
  if (!bounds) return null
  if (row.count == null) return bounds.min
  const n = row.count + step
  return n < bounds.min || n > bounds.max ? null : n
}
const canNudge = (row, step) => nudged(row, step) != null
const nudge = (row, step) => {
  const n = nudged(row, step)
  if (n != null) emit('edit', row.rung, n)
}
const onUnreach = (row) => {
  editing.value = null
  emit('unreach', row.rung)
}

const onRung = (row) => {
  if (canSelect(row)) {
    editing.value = null
    emit('select', row.rung)
  } else if (canEditRow(row)) {
    editing.value = openRung.value === row.rung ? null : row.rung
  }
}

const rungName = (row) => {
  const named = { label: rungLabel(row), points: rungPoints(row) }
  const key = (name) => (named.points == null ? `ladder.${name}_unscored` : `ladder.${name}`)
  if (row.status === 'reached') {
    if (row.count == null) return t(key('rung_reached_unknown'), named)
    return t(key(row.isTop ? 'rung_topped' : 'rung_reached'), { ...named, n: row.count }, row.count)
  }
  if (row.status === 'active') {
    const n = props.state.attempts
    return t(key('rung_active'), { ...named, n }, n)
  }
  return t(key('rung_idle'), named)
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
  min-width: 0;
  color: var(--ladder-ink);
  font-variant-numeric: tabular-nums;
  /* A Framework7 list title does not wrap and clips with an ellipsis; the
     ladder lays out its own lines. */
  white-space: normal;
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

/* The route's own tape runs up the ladder, node to node. Each step draws its
   stretch of it, so the tape still ends on the first and the last node when
   a label wraps or a rung has its editor open underneath. */
.ladder__spine,
.ladder__step::before {
  position: absolute;
  left: 14px;
  width: 6px;
  box-sizing: border-box;
  border-inline: 1px solid var(--ladder-tape-edge);
  background: var(--ladder-tape);
}
.ladder__spine {
  top: 22px;
  bottom: 22px;
  border-radius: 2px;
}
.ladder__spine--idle {
  background: var(--ladder-hold-strong);
}
.ladder__step::before {
  content: '';
  /* up through the gap to the step above */
  top: -2px;
  bottom: 0;
}
/* the lowest rung: from its node upward only */
.ladder__step:first-child::before {
  bottom: auto;
  height: 24px;
  border-radius: 0 0 2px 2px;
}
/* the Top: from its node downward only */
.ladder__step:last-child::before {
  top: 22px;
  border-radius: 2px 2px 0 0;
}
.ladder__step:only-child::before {
  content: none;
}

.ladder__step {
  position: relative;
  min-width: 0;
}

/* One line when there is room: node, label, mark. In a narrow row the mark
   wraps under the label instead of squeezing it to "T…". */
.ladder__rung {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0 8px;
  width: 100%;
  min-height: 44px;
  padding: 5px 8px 5px 7px;
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
.ladder__nudge:focus-visible,
.ladder__quiet:focus-visible {
  outline: 2px solid var(--ladder-focus);
  outline-offset: 2px;
}

.ladder__node {
  position: relative;
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 7px;
  border-radius: 9999px;
  border: 2px solid var(--ladder-idle);
  background: var(--ladder-paper);
  z-index: 1;
}

/* The node sits on the label's first line, 22px down the step whatever the
   label's height, which is where the tape expects it. */
.ladder__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  /* Wants its full width (so the mark wraps away first) and gives way only
     when the label alone is wider than the row. */
  flex: 1 1 auto;
  min-width: 0;
  min-height: 32px;
}
.ladder__label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex: 1;
  padding: 7px 0;
}
/* Routesetter labels run to 40 characters: they wrap (up to three lines)
   rather than being cut off. */
.ladder__name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.ladder__points {
  flex: none;
  font-size: 0.75rem;
  color: var(--ladder-ink-soft);
  white-space: nowrap;
}

.ladder__mark {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  min-height: 22px;
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
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
/* a reached rung can be corrected: a quiet pencil says so */
.ladder__pencil {
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.6;
}
.ladder__step--open .ladder__rung {
  background: var(--ladder-hold);
  border-color: var(--ladder-hold-strong);
}
.ladder__step--open .ladder__pencil {
  opacity: 1;
}

/* the editor of a reached rung, hanging off the spine under its rung */
.ladder__edit {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 8px;
  margin: 2px 0 6px 33px;
  padding: 6px 6px 0 8px;
  border-left: 2px solid var(--ladder-reached);
  border-radius: 0 8px 8px 0;
  background: var(--ladder-hold);
}
.ladder__edit--top {
  border-left-color: var(--ladder-top);
}
/* the stepper on a line of its own; Remove and Done share the next one */
.ladder__stepper {
  display: flex;
  flex: 1 0 100%;
  align-items: center;
  gap: 4px;
}
.ladder__nudge {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--ladder-hold-strong);
  background: var(--ladder-paper);
  color: var(--ladder-ink);
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ladder__nudge:active:not(:disabled) {
  background: var(--ladder-hold-strong);
}
.ladder__edit-count {
  min-width: 3em;
  text-align: center;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--ladder-reached-text);
  white-space: nowrap;
}
.ladder__edit--top .ladder__edit-count {
  color: var(--ladder-top);
}
.ladder__edit .ladder__quiet {
  /* Framework7 stretches every button to its container's width */
  width: auto;
  min-height: 40px;
  padding: 0 2px;
  font-size: 0.8125rem;
}
.ladder__edit-done {
  margin-left: auto;
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
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
/* side by side when both fit, one under the other in a narrow row */
.ladder__btn {
  flex: 1 1 5.25rem;
  min-height: 48px;
  padding: 0 6px;
  white-space: nowrap;
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
  flex-grow: 1.25;
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
.ladder__nudge:disabled,
.ladder__quiet:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ladder__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0 8px;
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
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 8px;
}
.ladder__rung--skeleton .ladder__node {
  margin-top: 0;
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
