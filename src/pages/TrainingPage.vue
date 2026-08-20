<template>
  <f7-page name="training">
    <f7-navbar :title="t('training.title')" back-link />

    <!-- Invitations come first and only when there are any. Someone has asked
         to coach you; that outranks anything already underway. -->
    <template v-if="invitations.length">
      <h2 class="training__section">{{ t('training.invitations') }}</h2>

      <div v-for="inv in invitations" :key="inv.id" class="invite">
        <p class="invite__who">
          {{ t('training.invited_by', { name: coachName(inv) }) }}
        </p>
        <p class="invite__what">{{ t('training.invite_explains') }}</p>

        <div class="invite__actions">
          <button class="invite__btn invite__btn--yes" @click="respond(inv, true)">
            {{ t('training.accept') }}
          </button>
          <button class="invite__btn" @click="startDecline(inv)">
            {{ t('training.decline') }}
          </button>
        </div>

        <!-- The reason is asked for, not demanded: a coach declined with
             nothing cannot tell "wrong person" from "not right now". -->
        <div v-if="decliningId === inv.id" class="invite__decline">
          <input
            v-model="declineReason"
            class="invite__reason"
            type="text"
            :placeholder="t('training.decline_reason_hint')"
            @keyup.enter="respond(inv, false)"
          />
          <button class="invite__btn invite__btn--no" @click="respond(inv, false)">
            {{ t('training.send_decline') }}
          </button>
        </div>
      </div>
    </template>

    <h2 v-if="assignments.length" class="training__section">{{ t('training.your_programs') }}</h2>

    <p v-if="loading" class="training__note">{{ t('training.loading') }}</p>
    <p v-else-if="!assignments.length && !invitations.length" class="training__note">
      {{ t('training.nothing_yet') }}
    </p>

    <f7-list v-if="assignments.length" media-list class="training__list">
      <f7-list-item
        v-for="a in assignments"
        :key="a.id"
        link="#"
        :title="a.name"
        :subtitle="a.coach ? t('training.set_by', { name: `${a.coach.etunimi} ${a.coach.sukunimi}` }) : ''"
        @click="open(a)"
      >
        <template #after>
          <span class="training__progress num">{{ progressOf(a) }}</span>
        </template>
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import { progress } from '@helpers/trainingFormat.js'

const { t } = useI18n()

const invitations = ref([])
const assignments = ref([])
const loading = ref(true)
const decliningId = ref(null)
const declineReason = ref('')

const coachName = (inv) =>
  `${inv.coach?.etunimi ?? ''} ${inv.coach?.sukunimi ?? ''}`.trim() || t('training.a_coach')

const progressOf = (a) => {
  const { done, total } = progress(a)
  return total ? `${done}/${total}` : ''
}

const load = async () => {
  loading.value = true
  try {
    const [invites, mine] = await Promise.all([api.coachInvitations(), api.myTrainingAssignments()])
    invitations.value = invites
    assignments.value = mine
  } finally {
    loading.value = false
  }
}

const startDecline = (inv) => {
  decliningId.value = inv.id
  declineReason.value = ''
}

const respond = async (inv, accept) => {
  await api.respondToCoachInvitation({
    id: inv.id,
    accept,
    reason: accept ? null : declineReason.value || null
  })
  decliningId.value = null
  await load()
}

const open = (assignment) => {
  f7.views.main.router.navigate(`/training/${assignment.id}`)
}

onMounted(load)
</script>

<style scoped>
.training__section {
  margin: 1.25rem 1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p-text-dim);
}

.training__note {
  margin: 1rem;
  font-size: 0.9rem;
  color: var(--p-text-dim);
}

.training__progress {
  font-size: 0.8rem;
  color: var(--p-text-muted);
}

/* An invitation is a decision, so it gets a card of its own rather than a row
   in a list of things you already have. */
.invite {
  margin: 0 1rem 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.invite__who {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--p-text);
}

.invite__what {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--p-text-dim);
}

.invite__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.invite__btn {
  flex: 1;
  padding: 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: none;
  color: var(--p-text);
  font-size: 0.88rem;
  font-weight: 600;
}

.invite__btn--yes {
  background: rgba(var(--p-accent-rgb), 0.9);
  border-color: transparent;
  color: #fff;
}

.invite__btn--no {
  flex: none;
  padding-inline: 0.9rem;
  color: var(--p-danger-tint);
}

.invite__decline {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.invite__reason {
  flex: 1;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--p-text);
  font-size: 0.85rem;
}
</style>
