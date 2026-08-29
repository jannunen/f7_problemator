<template>
  <f7-page name="training-program">
    <f7-navbar :title="assignment?.name ?? t('training.title')" back-link>
      <template #right>
        <span v-if="assignment" class="prog__count num">{{ done }}/{{ total }}</span>
      </template>
    </f7-navbar>

    <p v-if="loading" class="prog__note">{{ t('training.loading') }}</p>

    <template v-else-if="assignment">
      <p v-if="assignment.description" class="prog__desc">{{ assignment.description }}</p>

      <!-- The coach who set this programme is the obvious person to ask about
           it, and finding them via the side panel means knowing the menu holds
           messages at all. Below the description rather than in the navbar:
           it is an action about this programme, not chrome. -->
      <f7-button
        v-if="canMessageCoach"
        outline
        class="prog__msg"
        :disabled="messaging"
        @click="messageCoach"
      >
        {{ coachName ? t('training.message_coach_named', { name: coachName }) : t('training.message_coach') }}
      </f7-button>

      <!-- Two questions, two shapes. The list answers "what is next"; the
           calendar answers "what does my month look like". -->
      <div class="modes">
        <button
          class="modes__btn"
          :class="{ 'modes__btn--on': mode === 'list' }"
          @click="mode = 'list'"
        >
          <i class="material-icons modes__icon">view_list</i>
          {{ t('training.view_list') }}
        </button>
        <button
          class="modes__btn"
          :class="{ 'modes__btn--on': mode === 'calendar' }"
          @click="mode = 'calendar'"
        >
          <i class="material-icons modes__icon">calendar_month</i>
          {{ t('training.view_calendar') }}
        </button>
      </div>

      <label class="prefrow">
        <input
          v-model="clearMarksOnOpen"
          type="checkbox"
        >
        <span>{{ t('training.clear_marks_on_open') }}</span>
      </label>

      <training-calendar
        v-if="mode === 'calendar'"
        :assignment="assignment"
        @open="peek"
      />

      <template v-else>

      <!-- Grouped by week, because that is how it was written and how it will
           be lived. Today's session is worth finding fast, so the first
           unfinished week opens and the rest stay shut. -->
      <div v-for="(sessions, week) in byWeek" :key="week" class="week">
        <button class="week__head" @click="toggle(week)">
          <span class="week__title">{{ t('training.week', { n: week }) }}</span>
          <span class="week__done num">{{ doneIn(sessions) }}/{{ sessions.length }}</span>
          <i class="material-icons week__chev">{{ open[week] ? 'expand_less' : 'expand_more' }}</i>
        </button>

        <div v-show="open[week]" class="week__body">
          <button
            v-for="s in sessions"
            :key="s.id"
            class="day"
            :class="{ 'day--done': s.completed_at }"
            @click="openSession(s)"
          >
            <span class="day__when">{{ dayName(s.day) }}</span>
            <span class="day__title">{{ s.title || t('training.session') }}</span>
            <span
              v-if="unread(s)"
              class="day__alert"
              :title="t('training.coach_said')"
            />
            <i v-if="s.completed_at" class="material-icons day__tick">check_circle</i>
            <i v-else class="material-icons day__go">chevron_right</i>
          </button>
        </div>
      </div>
      </template>
    </template>

    <training-day-sheet
      v-model:opened="sheetOpen"
      :session="peeked"
      :starts-on="assignment?.starts_on ?? null"
      @open="goToSession"
      @read="toggleRead"
    />
  </f7-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import { dayName, progress } from '@helpers/trainingFormat.js'
import TrainingCalendar from '@components/training/TrainingCalendar.vue'
import TrainingDaySheet from '@components/training/TrainingDaySheet.vue'
import { clearMarksOnOpen } from '@helpers/trainingPrefs.js'

const props = defineProps({ f7route: { type: Object, default: () => ({}) } })

const { t } = useI18n()
const assignment = ref(null)
const loading = ref(true)
const open = reactive({})
const mode = ref('list')
const sheetOpen = ref(false)
const peeked = ref(null)

const byWeek = computed(() => {
  const groups = {}
  for (const s of assignment.value?.sessions ?? []) (groups[s.week] ??= []).push(s)
  return groups
})

// The coach's own id and name ride along on the assignment already, so the
// button knows who it writes to without asking.
const coaches = ref([])
const messaging = ref(false)

const coachId = computed(() => assignment.value?.coach_climber_id ?? null)
const coachName = computed(() => assignment.value?.coach?.etunimi ?? '')

/**
 * Only while the coaching is live.
 *
 * A finished programme stays readable — that is deliberate — but the server
 * refuses a message once the relationship has ended, and a button that can
 * only produce a 403 is worse than no button.
 */
const canMessageCoach = computed(() =>
  coachId.value != null &&
  coaches.value.some((r) => (r?.coach_climber_id ?? r?.coach?.id) === coachId.value)
)

/** Open-or-get, so this never makes a second thread with the same coach. */
const messageCoach = async () => {
  if (messaging.value || coachId.value == null) return
  messaging.value = true
  try {
    await api.openDirectThread(coachId.value)
    f7.views.main.router.navigate('/messages')
  } catch {
    // The relationship ended between loading this page and tapping. Drop the
    // button rather than explaining a failure.
    coaches.value = []
  } finally {
    messaging.value = false
  }
}

const done = computed(() => progress(assignment.value).done)
const total = computed(() => progress(assignment.value).total)

// Feedback that has arrived and not been cleared. Read notes keep their
// words but lose their flag.
const unread = (s) => !!s.coach_notes && !s.coach_notes_read_at

const doneIn = (sessions) => sessions.filter((s) => s.completed_at).length
const toggle = (week) => (open[week] = !open[week])

const openSession = (session) => {
  f7.views.main.router.navigate(`/training/${assignment.value.id}/session/${session.id}`)
}

// A tap on the calendar is usually a question, not a commitment: show the day
// over the month rather than replacing it.
const peek = (session) => {
  peeked.value = session
  sheetOpen.value = true

  // For climbers who asked for it, opening the day is reading it. Off by
  // default, so a flag never clears while someone is scrolling past.
  if (clearMarksOnOpen.value && session.coach_notes && !session.coach_notes_read_at) {
    toggleRead(session)
  }
}

// Marked from inside the sheet. Refetch quietly and re-point at the same day:
// `peeked` holds the object from the previous fetch, so the sheet would
// otherwise keep showing the flag the climber just cleared.
const toggleRead = async (session) => {
  await api.markTrainingFeedbackRead({
    id: session.id,
    read: !session.coach_notes_read_at
  })
  await load({ quiet: true })
  peeked.value = (assignment.value?.sessions ?? []).find((s) => s.id === session.id) ?? null
}

// Close before navigating, so the sheet's own animation does not race the
// page transition.
const goToSession = (session) => {
  sheetOpen.value = false
  openSession(session)
}

// `quiet` refetches without flipping `loading`: clearing a mark inside the
// sheet should update the dots behind it, not blank the month for the length
// of a request.
const load = async ({ quiet = false } = {}) => {
  if (!quiet) loading.value = true
  try {
    assignment.value = await api.trainingAssignment(props.f7route.params.id)
    // Who still coaches this climber, which decides whether the message
    // button is offered. A failure here costs the button, not the page.
    coaches.value = await api.myCoaches().catch(() => [])

    // Open the first week with work left in it. Scrolling past finished weeks
    // to find today is the thing that would make this tedious.
    const weeks = Object.keys(byWeek.value)
    const next = weeks.find((w) => byWeek.value[w].some((s) => !s.completed_at)) ?? weeks[0]
    if (next) open[next] = true
  } finally {
    if (!quiet) loading.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.prefrow {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.35rem 16px 0.6rem;
  font-size: 0.75rem;
  color: var(--p-text-muted);
}

/* Feedback on this day. Small and red: it is a flag, not a message. */
.day__alert {
  flex: none;
  width: 8px;
  height: 8px;
  margin-left: 0.35rem;
  border-radius: 50%;
  background: var(--p-danger, #ef4444);
}

.modes {
  display: flex;
  gap: 6px;
  margin: 0.5rem 16px 0.25rem;
}

.modes__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  justify-content: center;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius-sm, 6px);
  background: none;
  color: var(--p-text-muted);
  font-size: 0.78rem;
}

.modes__btn--on {
  background: var(--p-bg-card);
  border-color: var(--p-accent);
  color: var(--p-text);
}

.modes__icon {
  font-size: 1rem;
}

.prog__note, .prog__desc {
  margin: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--p-text-dim);
}

.prog__count { font-size: 0.85rem; color: var(--p-text-muted); }

.week { margin: 0 1rem 0.5rem; }

.week__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.7rem 0.25rem;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: none;
  color: var(--p-text);
  text-align: left;
}

.week__title { font-size: 0.9rem; font-weight: 600; }

.week__done {
  margin-left: auto;
  font-size: 0.78rem;
  color: var(--p-text-dim);
}

.week__chev { font-size: 1.1rem; color: var(--p-text-dark); }

.week__body { padding: 0.4rem 0 0.6rem; }

.day {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.65rem 0.25rem;
  border: none;
  background: none;
  color: var(--p-text);
  text-align: left;
}

/* A finished day recedes rather than disappears: you still want to see it, but
   not to have to read past it. */
.day--done .day__title { color: var(--p-text-dim); }

.day__when {
  width: 2.4rem;
  flex: none;
  font-size: 0.75rem;
  color: var(--p-text-dark);
}

.day__title { flex: 1; font-size: 0.92rem; }

.day__tick { font-size: 1.15rem; color: var(--p-success, #4ade80); }
.day__go { font-size: 1.15rem; color: var(--p-text-dark); }

/* No fill, and the app's muted tokens rather than the theme accent. The
   accent is #38bdf8 — loud enough on a full-width button to read as a
   warning, when this is just a quiet way to ask your coach something. */
.prog__msg {
  margin: 0.2rem 1rem 1rem;
  background: transparent;
  border-color: var(--p-border-light);
  color: var(--p-text-secondary);
}
</style>
