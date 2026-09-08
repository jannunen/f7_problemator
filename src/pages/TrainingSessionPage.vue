<template>
  <f7-page name="training-session">
    <f7-navbar :title="session?.title || t('training.session')" back-link />

    <p v-if="loading" class="sess__note">{{ t('training.loading') }}</p>

    <session-body
      v-else-if="session"
      :session="session"
      :coach="coach"
      @changed="load"
    />
  </f7-page>
</template>

<script setup>
/**
 * A session on its own page, reached from the week list.
 *
 * The exercises and the finish control live in SessionBody, which the
 * calendar's day sheet renders too — the same day should offer the same
 * powers however you arrived at it.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import SessionBody from '@components/training/SessionBody.vue'

const props = defineProps({ f7route: { type: Object, default: () => ({}) } })

const { t } = useI18n()
const session = ref(null)
const loading = ref(true)

// Who wrote the feedback, so the climber can answer it. The assignment
// carries this and the page used to throw it away, which is why the only
// thing you could do with a question from your coach was tick it read.
const coach = ref(null)

const load = async () => {
  loading.value = true
  try {
    const assignment = await api.trainingAssignment(props.f7route.params.id)
    session.value = (assignment.sessions ?? []).find(
      (s) => String(s.id) === String(props.f7route.params.sessionId)
    )
    coach.value = assignment.coach_climber_id
      ? { climberId: assignment.coach_climber_id, name: assignment.coach?.etunimi ?? '' }
      : null
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.sess__note {
  margin: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--p-text-dim);
}
</style>
