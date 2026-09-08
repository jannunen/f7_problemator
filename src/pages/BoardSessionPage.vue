<template>
  <f7-page name="board-session">
    <f7-navbar :title="t('board.title')" back-link />

    <!-- Running totals, so the session is visible while it is being built
         rather than only after saving. -->
    <div class="bs__totals">
      <div class="bs__total">
        <span class="bs__total-n num">{{ totals.sends }}</span>
        <span class="bs__total-l">{{ t('board.sends') }}</span>
      </div>
      <div class="bs__total">
        <span class="bs__total-n num">{{ totals.projects }}</span>
        <span class="bs__total-l">{{ t('board.projects') }}</span>
      </div>
      <div class="bs__total">
        <span class="bs__total-n num">{{ totals.hardest ?? '—' }}</span>
        <span class="bs__total-l">{{ t('board.hardest') }}</span>
      </div>
      <div class="bs__total">
        <span class="bs__total-n num">{{ score }}</span>
        <span class="bs__total-l">{{ t('board.score') }}</span>
      </div>
    </div>

    <!-- Today's running total and the day to beat. Shown only once it is
         known: a best day of zero for somebody who has never ticked anything
         is worse than saying nothing. -->
    <p v-if="dayScore" class="bs__best">
      {{ t('board.today_total', { n: dayScore.today.score + score }) }}
      <template v-if="dayScore.best">
        · {{ t('board.your_best', { n: dayScore.best.score }) }}
      </template>
    </p>

    <div v-if="histogram.length" class="bs__hist">
      <div v-for="h in histogram" :key="h.gradeid" class="bs__bar">
        <span class="bs__bar-n num">{{ h.count }}</span>
        <span class="bs__bar-g">{{ h.name }}</span>
      </div>
    </div>

    <!-- Board, angle, date. Angle disappears for "everything else", which
         has no single angle to give. -->
    <div class="bs__setup">
      <select v-model="board" class="bs__select">
        <option v-for="b in BOARDS" :key="b" :value="b">{{ t('board.name_' + b) }}</option>
      </select>

      <select v-if="needsAngle(board)" v-model.number="angle" class="bs__select">
        <option v-for="a in ANGLES" :key="a" :value="a">{{ a }}°</option>
      </select>

      <button class="bs__select bs__date" @click="dateOpen = true">
        {{ formatDate(date) }}
      </button>
    </div>

    <p v-if="gymName" class="bs__gym">{{ t('board.at_gym', { gym: gymName }) }}</p>

    <!-- The grade. Big and scrollable, because it is the one choice made
         over and over. -->
    <!-- One row, scrolled rather than wrapped: the full ladder is thirty-odd
         grades, and wrapping it pushed the tries stepper and the Add button
         off the bottom of a phone — the two controls pressed most often. -->
    <div ref="gradeStrip" class="bs__grades">
      <button
        v-for="g in gradeList"
        :key="g.id"
        :ref="(el) => setGradeRef(g.id, el)"
        class="bs__grade"
        :class="{ 'bs__grade--on': gradeid === g.id }"
        @click="select(g.id)"
      >{{ g.name }}</button>
    </div>

    <!-- The same two controls as AddTick.vue, deliberately: one try is a
         flash and more is a redpoint, so there is nothing else to ask. -->
    <div class="bs__controls">
      <div class="bs__tries">
        <f7-stepper v-model:value="tries" :min="1" :max="9999" large round fill />
        <span class="bs__tries-l">{{ t('problem.tries', tries) }}</span>
      </div>

      <div class="p-toggle-group">
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': ticktype === 'tick' }"
          @click="ticktype = 'tick'"
        >{{ t('problem.send') }}</button>
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': ticktype === 'pretick' }"
          @click="ticktype = 'pretick'"
        >{{ t('problem.still_a_project') }}</button>
      </div>
    </div>

    <button class="p-btn p-btn--primary p-btn--block bs__add" :disabled="!gradeid" @click="add">
      {{ t('board.add') }}
    </button>

    <!-- What is in the session so far, newest first, each removable. Nothing
         reaches the server until Save, so a mistake costs one tap. -->
    <div v-if="ascents.length" class="bs__list">
      <div v-for="(a, i) in reversed" :key="a.key" class="bs__row">
        <span class="bs__row-g">{{ gradeName(a.gradeid) }}</span>
        <span class="bs__row-t">{{ t('problem.tries', a.tries) }}</span>
        <span v-if="a.ticktype === 'pretick'" class="bs__row-p">{{ t('board.project') }}</span>
        <button class="bs__row-x" @click="remove(ascents.length - 1 - i)">
          <i class="material-icons">close</i>
        </button>
      </div>
    </div>

    <p v-if="error" class="bs__error">{{ error }}</p>

    <button
      v-if="ascents.length"
      class="p-btn p-btn--primary p-btn--block bs__save"
      :disabled="saving"
      @click="save"
    >
      {{ saving ? t('board.saving') : t('board.save', { n: ascents.length }) }}
    </button>

    <popup-tick-date
      :opened="dateOpen"
      key="boardsessiondate"
      @select="(d) => { date = d; dateOpen = false }"
      @close="dateOpen = false"
    />
  </f7-page>
</template>

<script setup>
/**
 * Logging a board session, or a session off any board at all.
 *
 * Shaped like a fast tick screen — totals and a grade histogram at the top,
 * the grade chosen over and over below, everything on one page — but using
 * Problemator's own controls rather than flash/redpoint buttons: a tries
 * stepper where one try is a flash, and a send/project toggle. Nothing is
 * sent until Save, so the whole session is one request and a mistyped ascent
 * costs a tap rather than a delete.
 */
import { computed, nextTick, onMounted, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import api from '@js/api.js'
import PopupTickDate from '@components/problem/TickDate.vue'
import {
  BOARDS,
  needsAngle,
  buildPayload,
  summarise,
  byGrade,
  sessionScore
} from '@js/helpers/boardSession.js'

const { t } = useI18n()
const store = useStore()

const ANGLES = [0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]

const board = ref('kilter')
const angle = ref(40)
const date = ref(new Date())
const dateOpen = ref(false)

const gradeid = ref(null)
const tries = ref(1)
const ticktype = ref('tick')

const ascents = ref([])
const saving = ref(false)
const error = ref(null)

// Keyed by id in the store; the screen needs them in order, hardest last.
const grades = computed(() => store.state.grades ?? {})
const gradeList = computed(() =>
  Object.values(grades.value)
    .filter((g) => g?.id != null && g?.name)
    .sort((a, b) => Number(a.score ?? 0) - Number(b.score ?? 0))
)

// The gym they are standing in. Recorded as board_gymid, which is not the
// same column as gymid — a personal send never joins a gym's catalogue.
const gymId = computed(() => store.state.gym?.id ?? null)
const gymName = computed(() => store.state.gym?.name ?? '')

const totals = computed(() => summarise(ascents.value, grades.value))
const score = computed(() => sessionScore(ascents.value, grades.value))

// Today's total and the best day so far. A failure here costs the line, not
// the screen — logging must work whether or not the score loaded.
const dayScore = ref(null)
onMounted(async () => {
  dayScore.value = await api.myDayScore().catch(() => null)
})

// The strip is one scrolling row, so the selected grade has to be brought
// into view itself — picking 7C from the far end and then losing sight of it
// is worse than a wrapped list would have been.
const gradeStrip = ref(null)
const gradeEls = {}
const setGradeRef = (id, el) => {
  if (el) gradeEls[id] = el
}

const scrollGradeIntoView = async (id) => {
  await nextTick()
  gradeEls[id]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
}

const select = (id) => {
  gradeid.value = id
  scrollGradeIntoView(id)
}
const histogram = computed(() => byGrade(ascents.value, gradeList.value))
const reversed = computed(() => [...ascents.value].reverse())

const gradeName = (id) => grades.value[id]?.name ?? '?'

const formatDate = (d) =>
  dayjs(d).isSame(new Date(), 'day') ? t('problem.today') : dayjs(d).format('DD.MM.YYYY')

let seq = 0

/**
 * Appends and resets only the tries and the toggle — not the grade. Logging
 * five flashes at 6B should be five taps on Add, not five trips back to the
 * grade list.
 */
const add = () => {
  if (!gradeid.value) return

  ascents.value.push({
    key: ++seq,
    gradeid: gradeid.value,
    tries: tries.value,
    ticktype: ticktype.value
  })

  tries.value = 1
  ticktype.value = 'tick'
  error.value = null
}

const remove = (index) => ascents.value.splice(index, 1)

const save = async () => {
  if (saving.value || ascents.value.length === 0) return
  saving.value = true
  error.value = null

  try {
    await api.saveBoardSession(
      buildPayload({
        board: board.value,
        angle: angle.value,
        gymId: gymId.value,
        date: dayjs(date.value).format('YYYY-MM-DD'),
        ascents: ascents.value
      })
    )
    f7.views.main.router.back()
  } catch (e) {
    error.value = e?.response?.data?.errors
      ? t('board.save_invalid')
      : t('board.save_error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.bs__totals {
  display: flex;
  justify-content: space-around;
  padding: 0.9rem 1rem 0.6rem;
}

.bs__total { text-align: center; }

.bs__total-n {
  display: block;
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
}

.bs__total-l {
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.bs__hist {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0 1rem 0.8rem;
}

.bs__bar {
  flex: none;
  min-width: 2.4rem;
  text-align: center;
  padding: 0.25rem 0.3rem;
  border-radius: 8px;
  background: rgba(var(--p-accent-rgb), 0.12);
}

.bs__bar-n { display: block; font-weight: 700; font-size: 0.9rem; }
.bs__bar-g { font-size: 0.65rem; color: var(--p-text-muted); }

.bs__setup {
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 0.5rem;
}

.bs__select {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--p-border-light);
  background: transparent;
  color: var(--p-text-secondary);
  font-size: 0.85rem;
}

.bs__date { text-align: left; }

.bs__best {
  margin: 0 1rem 0.7rem;
  font-size: 0.78rem;
  color: var(--p-text-muted);
}

.bs__gym {
  margin: 0 1rem 0.6rem;
  font-size: 0.75rem;
  color: var(--p-text-dim);
}

.bs__grades {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.4rem;
  padding: 0 1rem 0.8rem;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.bs__grade {
  flex: 0 0 auto;
  scroll-snap-align: center;
  /* Sized so about ten sit in the strip on a phone. Wider than this and the
     ladder needs constant scrolling; narrower and "6B+" stops fitting. */
  min-width: 2.9rem;
  padding: 0.5rem 0.3rem;
  border-radius: 10px;
  border: 1px solid var(--p-border-light);
  background: transparent;
  color: var(--p-text-secondary);
  font-size: 0.95rem;
  font-weight: 600;
}

.bs__grade--on {
  background: var(--p-accent);
  border-color: var(--p-accent);
  color: #04121f;
}

.bs__controls {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0 1rem 0.8rem;
}

.bs__tries {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.bs__tries-l { font-size: 0.85rem; color: var(--p-text-muted); }

.bs__add { margin: 0 1rem 1rem; }

.bs__list { padding: 0 1rem; }

.bs__row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--p-border-light);
  font-size: 0.9rem;
}

.bs__row-g { font-weight: 700; min-width: 3rem; }
.bs__row-t { color: var(--p-text-muted); flex: 1; }

.bs__row-p {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-accent);
}

.bs__row-x {
  border: 0;
  background: none;
  color: var(--p-text-dim);
  padding: 0.2rem;
  line-height: 1;
}

.bs__error {
  margin: 0.8rem 1rem 0;
  color: var(--p-danger, #ef4444);
  font-size: 0.85rem;
}

.bs__save { margin: 1rem; }
</style>
