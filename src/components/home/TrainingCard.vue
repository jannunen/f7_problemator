<template>
  <!-- Nothing at all for the climbers who have no coach, which is nearly all
       of them. This appears only when there is something to act on. -->
  <div v-if="invitations.length || active" class="mx-4 my-2">
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
      <span class="material-icons tcard__icon">fitness_center</span>
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
