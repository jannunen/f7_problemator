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
      <div class="h-72 bg-gradient-to-b from-gray-800 to-gray-600 relative">
        <h1 class="pt-8 font-bold text-2xl bottom-0 text-center">
          {{ profile.etunimi }}
          {{ profile.sukunimi }}
        </h1>
        <p class="mx-auto w-4/5 px-10 italic">
          {{ profile.bio }}
        </p>
        <div class="absolute bottom-5 w-full">
          <div class="flex justify-between">
            <div class="py-2 px-4">
              <span class="font-bold text-2xl">{{ profile.boulder_hardest?.name.toUpperCase() }}</span>
              <h2>Hardest boulder</h2>
              <span class="font-bold text-2xl">{{ profile.sport_hardest?.name ?? "None"}}</span>
              <h2>Hardest sport</h2>
            </div>
          
            <div class="p-2">
            <span class="font-bold text-2xl">{{ estimateGrade(profile.boulder_top10_alltime,grades).toUpperCase() }}
            </span> <small class="px-1">({{ profile.boulder_top10_alltime }})</small>
            <h2>Top 10 alltime, boulder</h2>
            <span class="font-bold text-2xl">{{ estimateGrade(profile.sport_top10_alltime,grades) }}</span>
             <small class="px-1">({{ profile.sport_top10_alltime }})</small>
            <h2>Top 10 alltime, sport</h2>
            </div>
          </div>
          
        </div>
      </div>
      <div class="p-2">
        <profile-image :src="null" />
        <specs :profile="profile" />
        <p class="text-orange-300 text-center mt-3 uppercase text-xs font-bold"><small>You can change the personal data from the settings. If you don't want them to show, leave them empty.</small></p>
      </div>

      <div class="p-2">
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
import { ref, computed, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import ClimbedProblemListItem from '@components/profile/ClimbedProblemListItem.vue'
import ProfileImage from '@components/profile/ProfileImage.vue'
import Specs from '@components/profile/Specs.vue'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'

const { t } = useI18n()
const store = useStore()
const props = defineProps({
  id: Number,
})
const grades = computed(() => store.state.grades)

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + '/popup', {
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
