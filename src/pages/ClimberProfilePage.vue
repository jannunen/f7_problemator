<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('profile.climber_profile') }} </f7-nav-title>
    </f7-navbar>

    <div class="h-full justify-items-center flex" v-if="loading">
      <f7-preloader class="mx-auto" color="multi"></f7-preloader>
    </div>
    <div v-if="profile!=null" class="relative">
      <div class="h-72 bg-gradient-to-b from-gray-800 to-gray-600 relative">
        <climber-bio :profile="profile" />
      </div>
      <div class="p-2">
        <profile-image :src="null" />
        <specs :profile="profile" />
        <p class="text-orange-300 text-center mt-3 uppercase text-xs font-bold"><small>You can change the personal data from the settings. If you don't want them to show, leave them empty.
        </small>
        <a class="text-blue-400" href="#" @click.prevent="openSettings"> open settings </a>
        </p>
        <div class="my-1">
          <followers-data :profile="profile" />
        </div>

        <h1 class="font-bold mx-1 text-2xl">Latest ascents</h1>
        <f7-list v-if="profile.latest_ascents.length > 0" media class="p-2 my-0" problem-list>
          <climbed-problem-list-item
            v-for="problem in profile.latest_ascents"
            :key="problem.id"
            :problem="problem"
            @click="() => onStartNavigate(problem)"
          >
          </climbed-problem-list-item>
        </f7-list>
        <div class="my-2 px-4" v-else>No ascents yet</div>
      </div>
    </div>
  </f7-page>
</template>
<script setup>
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import ClimbedProblemListItem from '@components/profile/ClimbedProblemListItem.vue'
import ClimberBio from '@components/profile/ClimberBio.vue'
import FollowersData from '@components/profile/FollowersData.vue'
import ProfileImage from '@components/profile/ProfileImage.vue'
import Specs from '@components/profile/Specs.vue'

const { t } = useI18n()
const store = useStore()
const props = defineProps({
  id: Number,
})
const openSettings = () => {
  store.commit('setSelectedLeftPanelItem', 'settings')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/settings")
}

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem },
  })
}

const profile = computed(() => store.state.climbers.profile)
const loading = ref(true)
store.dispatch('climbers/profile', props.id).then((ret) => {
  loading.value = false
  //profile.value = ret
})
</script>
