<template>
  <f7-page name="messages" :class="{ 'messages--thread': openThread }">
    <!-- Back-link pops the router when the list is showing, but inside a
         thread it should only step back to the list — the thread is not a
         separate route, so the router has nothing to pop there. -->
    <f7-navbar :title="pageTitle" :back-link="!openThread">
      <template v-if="openThread" #left>
        <f7-link @click="closeThread">
          <i class="material-icons">arrow_back</i>
        </f7-link>
      </template>
    </f7-navbar>

    <template v-if="!openThread">
      <p v-if="loading" class="msgs__note">{{ t('messages.loading') }}</p>

      <!-- A way in. Without this a climber could only ever reply to a thread
           somebody else had started, so a new coach — or one who has not
           reviewed a session yet — could not be reached at all. -->
      <f7-list v-if="!loading && startable.length" class="msgs__start">
        <f7-list-item
          v-for="c in startable"
          :key="c.climberId"
          link="#"
          :title="t('messages.start_with', { name: c.name })"
          :disabled="starting"
          @click="start(c)"
        >
          <template #media>
            <i class="material-icons">chat_bubble_outline</i>
          </template>
        </f7-list-item>
      </f7-list>

      <!-- Two different empty states. A climber with no coach cannot message
           anyone, and telling them "no messages yet" would leave them looking
           for a button that should not exist. -->
      <p v-if="!loading && !threads.length && startable.length" class="msgs__note">
        {{ t('messages.nothing_yet') }}
      </p>
      <p v-else-if="!loading && !threads.length" class="msgs__note">
        {{ t('messages.no_coach') }}
      </p>

      <f7-list v-if="threads.length" media-list class="msgs__list">
        <f7-list-item
          v-for="thread in threads"
          :key="thread.id"
          link="#"
          :subtitle="thread.last_message?.body ?? ''"
          @click="open(thread)"
        >
          <template #title>
            {{ threadTitle(thread, myClimberId) || t('messages.someone') }}
            <!-- Which of these people coaches you. Obvious in a one-to-one and
                 the whole point in a phase 2 group, where several people are
                 in the thread and only one set the session. -->
            <span
              v-if="coachAmong(thread)"
              class="msgs__coach"
            >{{ t('messages.coach_tag') }}</span>
          </template>
          <template #after>
            <span v-if="thread.unread_count" class="msgs__badge">{{ thread.unread_count }}</span>
          </template>
        </f7-list-item>
      </f7-list>
    </template>

    <!-- A chat, laid out like one: the messages scroll, the composer does not
         move, and the newest message is the one you land on. -->
    <template v-else>
      <div class="chat">
      <p v-if="threadLoading" class="msgs__note">{{ t('messages.loading') }}</p>

      <!-- Oldest first, like any chat — the paginator itself sends newest
           first, since that is the page a client would ask for next. -->
      <div v-else class="thread">
        <div
          v-for="m in messages"
          :key="m.id"
          class="msg"
          :class="{ 'msg--mine': m.sender_climber_id === myClimberId }"
        >
          <span
            v-if="isCoach(m.sender_climber_id, openThread) && m.sender_climber_id !== myClimberId"
            class="msg__coach"
          >{{ t('messages.coach_tag') }}</span>
          <p class="msg__body">{{ m.body }}</p>
          <span class="msg__when">{{ showAgo(m.created_at) }}</span>
        </div>
        <p v-if="!messages.length" class="msgs__note">{{ t('messages.no_messages') }}</p>
      </div>

      <!-- can_write comes straight from the server, which is the only side
           that knows whether the coaching relationship is still live. -->
      <div v-if="canWrite" class="composer">
        <input
          v-model="draft"
          class="composer__input"
          type="text"
          :placeholder="t('messages.write_hint')"
          @keyup.enter="send"
        />
        <button class="composer__send" :disabled="!draft.trim() || sending" @click="send">
          {{ t('messages.send') }}
        </button>
      </div>
      <p v-else class="msgs__ended">{{ t('messages.ended') }}</p>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import api from '@js/api.js'
import { showAgo } from '@helpers'
import { threadTitle, coachesToStartWith, isCoach } from '@helpers/threads.js'

const props = defineProps({ f7route: { type: Object, default: () => ({}) } })

const { t } = useI18n()
const store = useStore()

const threads = ref([])
const loading = ref(true)

const openThread = ref(null)
const threadLoading = ref(false)
const messages = ref([])
const canWrite = ref(false)
const draft = ref('')
const sending = ref(false)

const myClimberId = computed(() => store.state.climber?.id)

const coaches = ref([])
const starting = ref(false)

// Only coaches there is no thread with yet — see coachesToStartWith.
const startable = computed(() => coachesToStartWith(coaches.value, threads.value))

/** True when someone other than the reader is the coach of this thread. */
const coachAmong = (thread) =>
  (thread?.participants ?? []).some(
    (p) => p?.climber_id !== myClimberId.value && isCoach(p?.climber_id, thread)
  )

/**
 * Open-or-get, then step straight into the thread. The server hands back an
 * existing one if there is any, so a double tap cannot make two.
 */
const start = async (coach) => {
  if (starting.value) return
  starting.value = true
  try {
    const thread = await api.openDirectThread(coach.climberId)
    await load()
    const fresh = threads.value.find((t) => t.id === thread.id)
    if (fresh) await open(fresh)
  } catch {
    // A relationship that ended between loading the page and tapping. The
    // list reloads and the button goes with it.
    await load()
  } finally {
    starting.value = false
  }
}

const pageTitle = computed(() =>
  openThread.value ? threadTitle(openThread.value, myClimberId.value) || t('messages.someone') : t('messages.title')
)

const load = async () => {
  loading.value = true
  try {
    // Both together: which conversations exist, and which coaches could be
    // started with. The second is what makes this screen reachable ground
    // rather than a list that can only ever be empty.
    const [mine, myCoaches] = await Promise.all([
      api.messageThreads(),
      api.myCoaches().catch(() => []),
    ])
    threads.value = mine
    coaches.value = myCoaches
  } finally {
    loading.value = false
  }
}

/**
 * Land on the newest message, the way every chat app does.
 *
 * Without this a thread with any history opens at its oldest message, and the
 * thing you came to read is somewhere below the fold.
 */
const scrollToNewest = async () => {
  await nextTick()
  const el = document.querySelector('.thread')
  if (el) el.scrollTop = el.scrollHeight
}

const open = async (thread) => {
  openThread.value = thread
  threadLoading.value = true
  try {
    const res = await api.messageThread(thread.id)
    // The paginator sends newest-first pages, because that is the one a
    // client would ask for next; a chat reads top-to-bottom, so it is
    // reversed here rather than asking the endpoint to change its contract.
    messages.value = (res?.data ?? []).slice().reverse()
    canWrite.value = res?.can_write ?? false

    // Opening a thread is reading it. Marked quietly and not awaited into the
    // loading state: a failed mark should not stop the messages from showing.
    api.markThreadRead(thread.id).then(load).catch(() => {})

    await scrollToNewest()
  } finally {
    threadLoading.value = false
  }
}

const closeThread = () => {
  openThread.value = null
  messages.value = []
  draft.value = ''
}

const send = async () => {
  const body = draft.value.trim()
  if (!body || sending.value) return

  sending.value = true
  try {
    const sent = await api.sendMessage(openThread.value.id, body)
    messages.value.push(sent)
    draft.value = ''
    await scrollToNewest()
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  await load()

  // Arrived at a specific conversation rather than the list — open it, so
  // whatever sent us here does not dump the reader on a list to find it.
  const wanted = Number(props.f7route?.params?.threadId)
  if (!wanted) return

  const thread = threads.value.find((t) => Number(t.id) === wanted)
  if (thread) await open(thread)
})
</script>

<style scoped>
.msgs__note {
  margin: 1rem;
  font-size: 0.9rem;
  color: var(--p-text-dim);
}

.msgs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.3rem;
  height: 1.3rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--p-danger, #ef4444);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.thread {
  padding: 0.75rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* The scroller. Takes the slack the composer does not, so the newest
     message can be scrolled to and the composer never moves. */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.msg {
  max-width: 80%;
  padding: 0.55rem 0.75rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  align-self: flex-start;
}

/* The reader's own messages align opposite the other side's, same as any
   chat surface — position alone tells you who said what. */
.msg--mine {
  align-self: flex-end;
  background: rgba(var(--p-accent-rgb), 0.22);
}

.msg__body {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--p-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.msg__when {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.7rem;
  color: var(--p-text-dark);
}

.composer {
  display: flex;
  gap: 0.5rem;
  padding: 0.6rem 1rem calc(0.6rem + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.composer__input {
  flex: 1;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: var(--p-text);
  font-size: 0.9rem;
}

.composer__send {
  padding: 0 1rem;
  border-radius: 10px;
  border: none;
  background: rgba(var(--p-accent-rgb), 0.9);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
}

.composer__send:disabled {
  opacity: 0.5;
}

/* No composer at all once the coaching has ended — the thread stays
   readable, but writing into it is over, not paused. */
.msgs__ended {
  margin: 0;
  padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.82rem;
  color: var(--p-text-dim);
  text-align: center;
}

/* Quiet: it labels a role, it is not an alert. The unread badge is the only
   thing on this screen that should pull the eye. */
.msgs__coach,
.msg__coach {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0 0.3rem;
  border-radius: 3px;
  background: rgb(128 128 128 / 18%);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  vertical-align: middle;
}

.msg__coach {
  margin: 0 0 0.15rem;
  display: block;
  width: fit-content;
}

/* Framework7's .page-content is the scroller by default. For a thread we want
   the opposite: the page holds still and the message list scrolls inside it,
   so the composer cannot drift off the bottom. Scoped to the thread view —
   the list view keeps ordinary page scrolling. */
.messages--thread :deep(.page-content) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
</style>
