<template>
  <!-- Nothing at all for the climbers who have no coach, which is nearly all
       of them. This appears only when there is something to act on — an
       invitation, a programme, or now an unread message with neither: a
       finished programme does not end the coaching relationship. -->
  <div v-if="invitations.length || active || unreadTotal(threads) > 0" class="tsec">
    <!-- The same section header the badges row uses. Without it the card
         floated between the badge cabinet and the expiring-problems alert
         with nothing saying what it was. -->
    <div class="tsec__head">
      <h3 class="tsec__title">{{ t('training.section_title') }}</h3>
    </div>
    <!-- An invitation outranks a programme: someone is waiting on an answer. -->
    <button v-if="invitations.length" class="tcard tcard--invite" @click="openList">
      <span class="material-icons tcard__icon">person_add</span>
      <span class="tcard__body">
        <span class="tcard__title">{{ inviteTitle }}</span>
        <span class="tcard__sub">{{ t('training.card_invite_sub') }}</span>
      </span>
      <span class="material-icons tcard__go">chevron_right</span>
    </button>

    <button v-else-if="active" class="tcard" @click="open">
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

    <!-- No invitation, no programme, but a coach has messaged: the coaching
         relationship outlives any one programme, so this still needs a row,
         not a blank section. Unlike the other two branches, the tap target
         here goes to /messages, not /training — there is no programme to
         send it to, and /training never marks anything read, which made
         this the one alert-dotted surface that led nowhere. -->
    <button v-else class="tcard" @click="openMessages">
      <span class="tcard__iconwrap">
        <span class="material-icons tcard__icon">chat</span>
        <span class="tcard__alert" />
      </span>
      <span class="tcard__body">
        <span class="tcard__title">{{ t('training.card_messages_title') }}</span>
        <span class="tcard__sub">{{ t('training.card_messages_sub') }}</span>
      </span>
      <span class="material-icons tcard__go">chevron_right</span>
    </button>

    <!-- Only when more than one programme is actually being trained. With a
         single one there is nothing to choose between, and the link would be
         a second route to the page you are already on. -->
    <button
      v-if="hasOtherPrograms"
      class="tcard__more"
      @click="openList"
    >
      {{ t('training.open_program_list') }}
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
import { trainingCardTarget, shouldOfferList } from '@helpers/trainingNav.js'
import { unreadTotal } from '@helpers/threads.js'

const { t } = useI18n()
const store = useStore()

const invitations = ref([])
const assignments = ref([])
const threads = ref([])

const isAuthenticated = computed(() => store.state.isAuthenticated)

const active = computed(() => assignments.value.find((a) => a.status === 'active') ?? null)
// There is no push notification here, so this dot is the only thing that
// tells a climber anything is waiting — session feedback or an unread
// message both light the same one rather than competing for a second spot.
const feedback = computed(() => (active.value?.coach_notes_count ?? 0) > 0 || unreadTotal(threads.value) > 0)

const inviteTitle = computed(() => {
  const first = invitations.value[0]
  const name = `${first?.coach?.etunimi ?? ''} ${first?.coach?.sukunimi ?? ''}`.trim()
  return name
    ? t('training.invited_by', { name })
    : t('training.card_invite_generic', { n: invitations.value.length })
})

const progressOf = (a) => progress(a)

// Straight into the programme the card is showing. It used to navigate to
// the list, so you arrived to pick the thing you had just been looking at.
const open = () => f7.views.main.router.navigate(trainingCardTarget(active.value))

// Invitations live on the list page, so that tap still belongs there.
const openList = () => f7.views.main.router.navigate('/training')

// The message-only branch has no programme to open, so it goes to messages.
const openMessages = () => f7.views.main.router.navigate('/messages')

const hasOtherPrograms = computed(() => shouldOfferList(assignments.value))

onMounted(async () => {
  if (!isAuthenticated.value) return

  try {
    const [invites, mine, mineThreads] = await Promise.all([
      api.coachInvitations(),
      api.myTrainingAssignments(),
      api.messageThreads()
    ])
    invitations.value = invites
    assignments.value = mine
    threads.value = mineThreads
  } catch {
    // A climber with no coach is the normal case and not worth a banner. The
    // card simply does not appear.
  }
})
</script>

<style scoped>
.tcard__more {
  display: block;
  width: 100%;
  margin-top: 0.4rem;
  padding: 0.5rem;
  border: 0;
  background: none;
  color: var(--f7-theme-color, #b5651d);
  font-size: 0.82rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
}
</style>

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
