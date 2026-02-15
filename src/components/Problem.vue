<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import AddTick from '@components/problem/AddTick.vue'
import LeftDetails from '@components/problem/LeftDetails.vue'
import RightDetails from '@components/problem/RightDetails.vue'
import ShowPublicAscents from '@components/problem/ShowPublicAscents.vue'
import ShowComments from '@components/problem/ShowComments.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'

import { useStore } from 'vuex'
import { f7, f7ready } from 'framework7-vue'
const store = useStore()
const showPublicAscentsDialog = ref(false)
const showCommentsDialog = ref(false)
const loading = ref(true)
const error = ref(false)
dayjs.extend(LocalizedFormat)
dayjs.extend(relativeTime)
const { t } = useI18n()
const problem = ref(null)
const props = defineProps({
  problem: Object,
  f7router: Object,
  id : Number,
})
if (props.id != null) {
  store.dispatch('getProblemDetails', props.id)
  .then((prob) => {
    loading.value = false
    problem.value = prob
  })
  .catch((err) => {
    console.log(err)
    loading.value = false
    error.value = true
  })

}
const problems = computed(() => store.state.problems)
const isAuthenticated = computed(() => store.state.isAuthenticated)

const onLoginClick = () => {
  f7.views.main.router.navigate({url : '/'  });
}

const onShowPublicAscents = (pid) => {
    showPublicAscentsDialog.value = true
}
const onShowComments = (pid) => {
    showCommentsDialog.value = true
}
const openAddTick = () => {
  const url = `/problem/${problem.id}/addtick`
  props.f7router.navigate(url)
}
</script>
<template>
  <div>
  <!-- Error state -->
  <div v-if="error" class="p-6 text-center">
    <span class="material-icons" style="font-size: 56px; color: var(--p-warning); display: block; margin-bottom: 1rem;">help_outline</span>
    <h1 class="text-xl font-bold mb-2" style="color: var(--p-text);">{{ t('problem.not_found_title', 'Oops! Route not found') }}</h1>
    <p class="text-sm mb-3" style="color: var(--p-text-muted); line-height: 1.5;">
      {{ t('problem.not_found_message', "It's not you, it's us. We couldn't find this route.") }}
    </p>
    <p class="text-xs" style="color: var(--p-text-dim); line-height: 1.5;">
      {{ t('problem.not_found_reasons', 'This could happen if the route has been removed or if you have a different gym selected.') }}
    </p>
  </div>

  <!-- Loading state -->
  <div v-else-if="loading" class="flex flex-col items-center justify-center py-12">
    <div class="p-spinner" style="width: 36px; height: 36px;"></div>
    <div class="text-sm mt-3 p-text-muted">Loading...</div>
  </div>

  <!-- Problem loaded -->
  <div v-else-if="problem != null && problem.id != null">

  <show-comments v-if="showCommentsDialog" :problem="problem" :opened="showCommentsDialog" @close="showCommentsDialog=false"> </show-comments>
  <show-public-ascents v-if="showPublicAscentsDialog" :problem="problem" :opened="showPublicAscentsDialog" @close="showPublicAscentsDialog=false"> </show-public-ascents>

    <!-- Problem details -->
    <div class="grid grid-cols-3 gap-0 my-2">
      <left-details :problem="problem" @show-comments="onShowComments" @show-public-ascents="onShowPublicAscents"></left-details>
      <right-details :problem="problem"></right-details>
    </div>

    <!-- Add tick section -->
    <div v-if="isAuthenticated" class="px-4 py-2">
      <div class="p-section-title text-center" style="font-size: 0.85rem;">{{ t('problem.add_new_tick') }}</div>
      <AddTick :problem="problem" />
    </div>
    <div v-else class="px-4 py-4">
      <div class="p-banner p-banner--warning">
        <span class="material-icons p-banner__icon">lock</span>
        <div class="p-banner__content">
          {{ t('You are not logged in, login to be able to tick the problem')}}
          <button @click="onLoginClick" class="p-btn p-btn--primary p-btn--block mt-3">{{ t('Login') }}</button>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>
