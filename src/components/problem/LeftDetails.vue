<template>
  <div class="dark:bg-blue-900/50 bg-gray-300 rounded-r-2xl flex flex-col items-center">
    <h1 class="text-4xl p-2 m-1">{{ problem.grade.name }}</h1>
    <round-badge :width="32" :bgColor="problem.colour.code"></round-badge>
    <div class="my-2">{{ getTagShort(problem.tag) }}</div>
    <a href="#" class="my-2 text-sm font-bold" @click.prevent="showPublicAscents">
      {{ t('problem.ascents', problem.total_ascents) }}
    </a>
    <div class="mt-2 text-sm font-bold">
      {{ t('problem.likes', problem.likeCount) }}
    </div>
    <div class="mb-2 flex flex-row my-1 w-4/5" v-if="isAuthenticated">
      <button @click="askLike" raised class="bg-white text-purple-900 px-1 py-1">
        <div material="favorite" color="red"></div>
        <f7-icon f7="heart_fill" size="20" color="red"></f7-icon>
        <span class="font-bold">{{ t('problem.dolike') }}</span>
      </button>
    </div>

    <div class="mt-2 text-sm font-bold">
      {{ t('problem.dislikes', problem.dislikeCount) }}
    </div>
    <div class="mb-2 flex flex-row my-1 w-4/5" v-if="isAuthenticated">
      <button
        @click="askDislike"
        raised
        class="bg-white text-purple-900 px-1 py-1 w-full"
      >
        <f7-icon f7="hand_thumbsdown_fill" size="20" color="black"></f7-icon>
        <span class="font-bold">{{ t('problem.dislike') }} +</span>
      </button>
    </div>

    <div class="mt-2 my-1 text-sm font-bold">
      <a href="#" class="mt-1 text-sm " @click.prevent="showComments">
      {{ t('problem.comments', problem.messages.length ) }}
      </a>
    </div>
  <div class="flex flex-row my-1 w-4/5" v-if="isAuthenticated">
      <button
        @click="askComment"
        raised
        class="bg-white text-purple-900 px-1 py-1 w-full"
      >
        <f7-icon f7="bubble_right_fill" size="20" color="black"></f7-icon>
        <span class="font-bold">{{ t('problem.comment') }} +</span>
      </button>
    </div>
    <!-- show ticked if so -->
    <div class="my-2" v-if="isMyTick(problem.id) || isMyProject(problem.id)">
      <div class="bg-green-500 px-2 py-1 text-white text-center text-xs rounded-full">
        {{ t('problem.ticked') }}
        <div size="12px" material="check"></div>
      </div>
      <button @click="myTicksPopupOpen = true" class="my-2 font-bold">
        {{ t('problem.see_ticks') }}
      </button>
    </div>

    <!-- Show project if so -->
    <div
      class="my-2"
      v-if="
        problem.myTicks != null &&
        problem.myTicks.length == 0 &&
        problem.myProjects.length > 0
      "
    >
      <div class="bg-yellow-500 px-2 py-1 text-white text-center text-xs rounded-full">
        {{ t('problem.projecting') }}
      </div>
      <button @click="myTicksPopupOpen = true" class="my-2 font-bold">
        <div class="my-1">{{ t('problem.sessions', sessionCount) }}</div>
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
import { useAuth0 } from '@auth0/auth0-vue'
const store = useStore()
const {
  idTokenClaims,
  getAccessTokenSilently,
  loginWithRedirect,
  logout,
  user,
  isAuthenticated,
} = useAuth0()

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

<style></style>
