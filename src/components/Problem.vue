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
import { useAuth0 } from '@auth0/auth0-vue';
const store = useStore()
const showPublicAscentsDialog = ref(false)
const showCommentsDialog = ref(false)
const loading = ref(true)
const { idTokenClaims, getAccessTokenSilently, loginWithRedirect, logout, user } = useAuth0();
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
  <div v-if="problem != null && problem.id != null">

  
  <show-comments v-if="showCommentsDialog" :problem="problem" :opened="showCommentsDialog" @close="showCommentsDialog=false"> </show-comments>
  <show-public-ascents v-if="showPublicAscentsDialog" :problem="problem" :opened="showPublicAscentsDialog" @close="showPublicAscentsDialog=false"> </show-public-ascents>
    <div class="m-0 p-0">

      <!-- problem details -->
      <div class="grid grid-cols-3 gap-4 my-3">
        <left-details :problem="problem" @show-comments="onShowComments" @show-public-ascents="onShowPublicAscents"></left-details>
        <right-details :problem="problem"></right-details>
      </div>

      <!-- top part ends -->
    </div>
    <div class="m-2" v-if="isAuthenticated">
      <h1 class="text-xl font-bold my-2 text-center">{{ t('problem.add_new_tick') }}</h1>
      <AddTick :problem="problem" />
    </div>
    <div v-else class="text-center my-2 font-bold" v-cloak>
      {{ t('You are not logged in, login to be able to tick the problem')}}
      <f7-button
      class="my-2 mx-2 uppercase block text-center button py-2 h-12 px-4 dark:bg-sky-500 bg-green-500 text-white"
       @click="onLoginClick">{{ t('Login') }}</f7-button>
    </div>
  </div>
</template>
