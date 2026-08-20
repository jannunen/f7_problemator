<template>
  <!-- Nothing at all for the climbers who have no coach, which is nearly all
       of them. This appears only when there is something to act on. -->
  <div v-if="invitations.length || active" class="tsec">
    <!-- The same section header the badges row uses. Without it the card
         floated between the badge cabinet and the expiring-problems alert
         with nothing saying what it was. -->
    <div class="tsec__head">
      <h3 class="tsec__title">{{ t('training.section_title') }}</h3>
    </div>
    <!-- An invitation outranks a programme: someone is waiting on an answer. -->
    <button v-if="invitations.length" class="tcard tcard--invite" @click="open">
      <span class="material-icons tcard__icon">person_add</span>
      <span class="tcard__body">
        <span class="tcard__title">{{ inviteTitle }}</span>
        <span class="tcard__sub">{{ t('training.card_invite_sub') }}</span>
      </span>
      <span class="material-icons tcard__go">chevron_right</span>
    </button>

    <button v-else class="tcard" @click="open">
      <span class="tcard__iconwrap">
        <span class="material-icons tcard__icon">fitness_center</span>
        <!-- Feedback waiting. Red because it is the one thing here addressed
             to this climber by a person, and it would otherwise sit unread
             inside a session they had no reason to reopen. -->
        <span v-if="feedback" class="tcard__alert" />
      </span>
      <span class="tcard__body">
        <span class="tcard__title">{{ active.name }}</span>
        <!-- Where they are in it, which is the one thing worth knowing from
             the home screen. -->
        <span class="tcard__sub">{{ t('training.card_progress', progressOf(active)) }}</span>
      </span>
      <span class="material-icons tcard__go">chevron_right</span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import { progress } from '@helpers/trainingFormat.js'

const { t } = useI18n()
const store = useStore()

const invitations = ref([])
const assignments = ref([])

const isAuthenticated = computed(() => store.state.isAuthenticated)

const active = computed(() => assignments.value.find((a) => a.status === 'active') ?? null)
const feedback = computed(() => (active.value?.coach_notes_count ?? 0) > 0)

const inviteTitle = computed(() => {
  const first = invitations.value[0]
  const name = `${first?.coach?.etunimi ?? ''} ${first?.coach?.sukunimi ?? ''}`.trim()
  return name
    ? t('training.invited_by', { name })
    : t('training.card_invite_generic', { n: invitations.value.length })
})

const progressOf = (a) => progress(a)

const open = () => f7.views.main.router.navigate('/training')

onMounted(async () => {
  if (!isAuthenticated.value) return

  try {
    const [invites, mine] = await Promise.all([api.coachInvitations(), api.myTrainingAssignments()])
    invitations.value = invites
    assignments.value = mine
  } catch {
    // A climber with no coach is the normal case and not worth a banner. The
    // card simply does not appear.
  }
})
</script>

<style scoped>
.tcard__iconwrap {
  position: relative;
  display: inline-flex;
  flex: none;
}

.tcard__alert {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--p-danger, #ef4444);
}

.tsec {
  margin: 0 16px 1rem;
}

.tsec__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.tsec__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.tcard {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--p-text);
  text-align: left;
}

/* An invitation is a question someone asked you, so it carries the accent.
   A programme in progress is just where you are, and stays quiet. */
.tcard--invite {
  border-color: rgba(var(--p-accent-rgb), 0.35);
  background: rgba(var(--p-accent-rgb), 0.07);
}

.tcard__icon {
  font-size: 1.4rem;
  color: var(--p-accent);
}

.tcard__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.tcard__title {
  font-size: 0.95rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tcard__sub {
  font-size: 0.78rem;
  color: var(--p-text-dim);
}

.tcard__go {
  font-size: 1.2rem;
  color: var(--p-text-dark);
}
</style>
