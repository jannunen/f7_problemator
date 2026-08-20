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
            <i v-if="s.completed_at" class="material-icons day__tick">check_circle</i>
            <i v-else class="material-icons day__go">chevron_right</i>
          </button>
        </div>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import { dayName, progress } from '@helpers/trainingFormat.js'

const props = defineProps({ f7route: { type: Object, default: () => ({}) } })

const { t } = useI18n()
const assignment = ref(null)
const loading = ref(true)
const open = reactive({})

const byWeek = computed(() => {
  const groups = {}
  for (const s of assignment.value?.sessions ?? []) (groups[s.week] ??= []).push(s)
  return groups
})

const done = computed(() => progress(assignment.value).done)
const total = computed(() => progress(assignment.value).total)

const doneIn = (sessions) => sessions.filter((s) => s.completed_at).length
const toggle = (week) => (open[week] = !open[week])

const openSession = (session) => {
  f7.views.main.router.navigate(`/training/${assignment.value.id}/session/${session.id}`)
}

const load = async () => {
  loading.value = true
  try {
    assignment.value = await api.trainingAssignment(props.f7route.params.id)

    // Open the first week with work left in it. Scrolling past finished weeks
    // to find today is the thing that would make this tedious.
    const weeks = Object.keys(byWeek.value)
    const next = weeks.find((w) => byWeek.value[w].some((s) => !s.completed_at)) ?? weeks[0]
    if (next) open[next] = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
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
</style>
