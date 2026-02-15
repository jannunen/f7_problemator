<template>
  <div class="left-panel">
    <h1 class="grade-display">{{ problem.grade.name }}</h1>
    <round-badge :width="32" :bgColor="problem.colour.code"></round-badge>
    <div class="tag-name">{{ getTagShort(problem.tag) }}</div>

    <a href="#" class="stat-link" @click.prevent="showPublicAscents">
      {{ t('problem.ascents', problem.total_ascents) }}
    </a>

    <div class="stat-text">
      {{ t('problem.likes', problem.likeCount) }}
    </div>
    <div class="action-row" v-if="isAuthenticated">
      <button @click="askLike" class="action-btn action-btn--like">
        <span class="material-icons" style="font-size: 16px; color: #ef4444;">favorite</span>
        <span>{{ t('problem.dolike') }}</span>
      </button>
    </div>

    <div class="stat-text">
      {{ t('problem.dislikes', problem.dislikeCount) }}
    </div>
    <div class="action-row" v-if="isAuthenticated">
      <button @click="askDislike" class="action-btn action-btn--dislike">
        <span class="material-icons" style="font-size: 16px;">thumb_down</span>
        <span>{{ t('problem.dislike') }} +</span>
      </button>
    </div>

    <div class="stat-text">
      <a href="#" class="stat-link" @click.prevent="showComments">
        {{ t('problem.comments', problem.messages.length ) }}
      </a>
    </div>
    <div class="action-row" v-if="isAuthenticated">
      <button @click="askComment" class="action-btn">
        <span class="material-icons" style="font-size: 16px;">chat_bubble</span>
        <span>{{ t('problem.comment') }} +</span>
      </button>
    </div>

    <!-- Ticked badge -->
    <div class="my-3" v-if="isMyTick(problem.id) || isMyProject(problem.id)">
      <div class="status-badge status-badge--ticked">
        <span class="material-icons" style="font-size: 12px;">check</span>
        {{ t('problem.ticked') }}
      </div>
      <button @click="myTicksPopupOpen = true" class="p-link text-xs mt-1 block text-center">
        {{ t('problem.see_ticks') }}
      </button>
    </div>

    <!-- Projecting badge -->
    <div
      class="my-3"
      v-if="
        problem.myTicks != null &&
        problem.myTicks.length == 0 &&
        problem.myProjects.length > 0
      "
    >
      <div class="status-badge status-badge--projecting">
        {{ t('problem.projecting') }}
      </div>
      <button @click="myTicksPopupOpen = true" class="p-link text-xs mt-1 block text-center">
        {{ t('problem.sessions', sessionCount) }}
      </button>
    </div>
    <popup-list-ticks
      :problem="problem"
      :ticks="problem.myTicks"
      :projects="problem.myProjects"
      :opened="myTicksPopupOpen"
      key="popuplistticks"
      @close="myTicksPopupOpen = false"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {f7 } from 'framework7-vue'
import { useStore } from 'vuex'
import { getTagShort } from '@js/helpers'
import { ref, computed } from 'vue'
import { confirm } from '@js/helpers/notifications.js'
import RoundBadge from '@components/ui/RoundBadge.vue'
import PopupListTicks from '@components/ui/problem/TickList.vue'
import { getSessionCount } from '@helpers/component.helpers.js'
const store = useStore()
const isAuthenticated = computed(() => store.state.isAuthenticated)

const { t } = useI18n()
const props = defineProps({
  problem: Object,
})
const emit = defineEmits(['open-my-ticks', 'show-public-ascents','show-comments'])
const ticks = computed(() => store.state.alltime.ticks)
const tries = computed(() => store.state.alltime.tries)
const showPublicAscents = () => {
  emit('show-public-ascents', props.problem.id)
}
const showComments = () => {
  emit('show-comments', props.problem.id)
}

const isMyProject = (pid) => {
  return tries.value.find((x) => x.problemid == pid)
}
const isMyTick = (pid) => {
  return ticks.value.find((x) => x.problemid == pid)
}
const myTicksPopupOpen = ref(false)
const askLike = () => {
  confirm(t('global.are_you_sure'), t('problem.confirm_like'), () => {
    store.dispatch('likeProblem', { id: props.problem.id })
  })
}
const askDislike = () => {
  confirm(t('global.are_you_sure'), t('problem.confirm_dislike'), () => {
    store.dispatch('dislikeProblem', { id: props.problem.id })
  })
}
const askComment = () => {
        f7.dialog.prompt('<div class="text-center">Comments are public!<br /><strong>What is your comment?</strong></div>', (comment) => {
          store.dispatch('commentProblem', { id: props.problem.id, comment })
          .then(() => {
            f7.dialog.alert('Thanks for your comment! It will be visible when it\'s has been approved by the admin.')
          })
          .catch((err) => {
            f7.dialog.alert('Sorry, something went wrong. Please try again later.')
          })
        });
}
const sessionCount = () => getSessionCount(props.problem)
</script>

<style scoped>
.left-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--p-bg-card);
  border: 1px solid var(--p-border);
  border-radius: 0 16px 16px 0;
  padding: 1rem 0.75rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.grade-display {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--p-text);
  line-height: 1;
  margin-bottom: 0.5rem;
}
.tag-name {
  font-size: 0.8rem;
  color: var(--p-text-muted);
  margin: 0.5rem 0;
}
.stat-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-accent);
  text-decoration: none;
  margin: 0.25rem 0;
}
.stat-link:hover {
  opacity: 0.8;
}
.stat-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-muted);
  margin-top: 0.5rem;
}
.action-row {
  width: 85%;
  margin: 0.375rem 0;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.375rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--p-border-light);
  background: rgba(255, 255, 255, 0.04);
  color: var(--p-text-secondary);
  cursor: pointer;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.action-btn:active {
  transform: scale(0.97);
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-badge--ticked {
  background: rgba(59, 178, 115, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(59, 178, 115, 0.3);
}
.status-badge--projecting {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
</style>
