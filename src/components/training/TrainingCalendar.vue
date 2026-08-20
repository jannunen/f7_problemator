<template>
  <div class="cal">
    <!-- Without a start date week/day are a running order, not a schedule, so
         there is no calendar to draw. Say so rather than inventing dates. -->
    <p v-if="!months.length" class="cal__none">{{ t('training.no_dates') }}</p>

    <template v-else>
      <div v-for="m in months" :key="m.key" class="cal__month">
        <h3 class="cal__title">{{ m.label }}</h3>

        <div class="cal__grid">
          <span v-for="(w, i) in weekdays" :key="'w' + i" class="cal__wd">{{ w }}</span>

          <span v-for="n in m.pad" :key="'p' + n" class="cal__pad" />

          <component
            :is="d.session ? 'button' : 'span'"
            v-for="d in m.days"
            :key="d.key"
            class="cal__day"
            :class="{
              'cal__day--today': d.isToday,
              'cal__day--has': !!d.session
            }"
            :type="d.session ? 'button' : null"
            :title="d.session ? d.session.title : null"
            @click="d.session && emit('open', d.session)"
          >
            <span class="cal__num num">{{ d.n }}</span>
            <span
              v-if="d.session"
              class="cal__dot"
              :class="`cal__dot--${d.state}`"
            />
            <!-- Feedback on this day, corner-pinned so it never displaces the
                 dot that says what the day is. -->
            <span
              v-if="d.feedback"
              class="cal__alert"
            />
          </component>
        </div>
      </div>

      <!-- A dot is only information if you know what it means. -->
      <div class="cal__legend">
        <span class="cal__key">
          <span class="cal__dot cal__dot--training" />{{ t('training.legend_training') }}
        </span>
        <span class="cal__key">
          <span class="cal__dot cal__dot--rest" />{{ t('training.legend_rest') }}
        </span>
        <span class="cal__key">
          <span class="cal__dot cal__dot--done" />{{ t('training.legend_done') }}
        </span>
        <span class="cal__key">
          <span class="cal__dot cal__dot--feedback" />{{ t('training.legend_feedback') }}
        </span>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * The programme laid on a real calendar: one dot per scheduled day, coloured
 * by what that day asks of you.
 *
 * The list answers "what is next"; this answers "what does my month look
 * like" — which is the question you have when booking a trip or a rest week.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { dateKey, isRest, sessionDate } from '@helpers/trainingFormat.js'

const props = defineProps({
  assignment: { type: Object, default: null }
})
const emit = defineEmits(['open'])

const { t, locale } = useI18n()

// Monday-first: this is a European gym, and a training week that starts on
// Sunday splits every block across two rows.
const weekdays = computed(() => {
  const base = new Date(2024, 0, 1) // a Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d.toLocaleDateString(locale.value, { weekday: 'narrow' })
  })
})

const mondayIndex = (d) => (d.getDay() + 6) % 7

/** Sessions keyed by the date they land on. */
const byDate = computed(() => {
  const map = new Map()
  const starts = props.assignment?.starts_on
  for (const s of props.assignment?.sessions ?? []) {
    const d = sessionDate(starts, s)
    if (d) map.set(dateKey(d), s)
  }
  return map
})

const stateOf = (session) => {
  if (session.completed_at) return 'done'
  return isRest(session) ? 'rest' : 'training'
}

const months = computed(() => {
  const keys = [...byDate.value.keys()].sort()
  if (!keys.length) return []

  const first = new Date(keys[0] + 'T00:00:00')
  const last = new Date(keys[keys.length - 1] + 'T00:00:00')
  const todayKey = dateKey(new Date())

  const out = []
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1)

  while (cursor <= last) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const length = new Date(year, month + 1, 0).getDate()

    const days = Array.from({ length }, (_, i) => {
      const d = new Date(year, month, i + 1)
      const key = dateKey(d)
      const session = byDate.value.get(key) ?? null
      return {
        key,
        n: i + 1,
        session,
        state: session ? stateOf(session) : null,
        feedback: !!session?.coach_notes && !session?.coach_notes_read_at,
        isToday: key === todayKey
      }
    })

    out.push({
      key: `${year}-${month}`,
      label: cursor.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' }),
      pad: mondayIndex(new Date(year, month, 1)),
      days
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  return out
})
</script>

<style scoped>
.cal {
  padding: 0 12px 1.5rem;
}

.cal__none {
  margin: 1rem;
  font-size: 0.9rem;
  color: var(--p-text-muted);
}

.cal__month {
  margin-top: 1.25rem;
}

.cal__title {
  margin: 0 4px 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.cal__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal__wd {
  padding-bottom: 4px;
  font-size: 0.65rem;
  text-align: center;
  color: var(--p-text-muted);
}

.cal__pad {
  aspect-ratio: 1;
}

/* Every cell is the same box whether or not it holds a session, so the grid
   stays square and the dots line up down the column. */
.cal__day {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--p-radius-sm, 6px);
  background: none;
  color: var(--p-text-dim);
  font: inherit;
}

.cal__day--has {
  background: var(--p-bg-card);
  color: var(--p-text);
  cursor: pointer;
}

.cal__day--today {
  border-color: var(--p-accent);
}

.cal__num {
  font-size: 0.7rem;
  line-height: 1;
}

.cal__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--p-text-muted);
}

.cal__alert {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--p-danger, #ef4444);
}

.cal__dot--training { background: var(--p-accent); }
.cal__dot--rest { background: var(--p-text-muted); }
.cal__dot--done { background: var(--p-success); }
.cal__dot--feedback { background: var(--p-danger, #ef4444); }

.cal__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  margin: 1.25rem 4px 0;
}

.cal__key {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--p-text-muted);
}
</style>
