<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('profile.climber_profile') }} </f7-nav-title>
    </f7-navbar>

    <div class="h-full justify-items-center flex" v-if="loading && profile == null">
      <f7-preloader class="mx-auto" color="multi"></f7-preloader>
    </div>
    <div v-else class="relative">
      <div class="h-72 bg-gradient-to-b from-gray-800 to-gray-600">
        <h1 class="pt-16 font-bold text-2xl bottom-0 text-center">
          {{ profile.etunimi }}
          {{ profile.sukunimi }}
        </h1>
        <p class="px-10 italic">
          {{ profile.bio }}
        </p>
      </div>
      <div class="p-2">
        <profile-image :src="null" />
        <specs :profile="profile" />
      </div>

      <div class="p-2">
        <h1 class="font-bold mx-1 text-2xl">Latest ascents</h1>
        <f7-list media class="p-2 my-0" problem-list>
           <climbed-problem-list-item
            v-for="problem in profile.latest_ascents"
            :key="problem.id"
            :problem="problem"
            @click="() => onStartNavigate(problem)" >
           </climbed-problem-list-item>
        </f7-list>
      </div>
    </div>
  </f7-page>
</template>
<script setup>
import { f7  } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ClimbedProblemListItem from '@components/profile/ClimbedProblemListItem.vue'
import ProfileImage from '@components/profile/ProfileImage.vue'
import Specs from '@components/profile/Specs.vue'
const { t } = useI18n()
const store = useStore()
const props = defineProps({
  id: Number,
})

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + "/popup", {
    props: { problem },
  })
}

const profile = ref(null)
const loading = ref(true)
store.dispatch('climber/profile', props.id).then((ret) => {
  loading.value = false
  profile.value = ret
})
</script>
