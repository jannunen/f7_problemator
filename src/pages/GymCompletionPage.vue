<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/home">&lt; back</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('gym.gym_completion_title') }} </f7-nav-title>
    </f7-navbar>
    <gym-completion
      :grades="grades"
      :problems="problemList"
      :ticks="allTime.ticks"
      :tries="allTime.tries"
      :gym-name="gym.name ?? ''"
      :loading="loading"
      @open-problem="openProblem"
    />
  </f7-page>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { useProfileGrades, useProfileGym, useProfileProblems } from '@js/useProfileSlice.js'
import { useAllTimeTicks } from '@js/useAllTimeTicks.js'
import { useGymStore } from '@js/stores/gym.store.js'
import GymCompletion from '@components/gym_completion/GymCompletion.vue'

const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
const gymStore = useGymStore()
const gymid = computed(() => gymStore.gymid)
const allTime = useAllTimeTicks()
const gym = useProfileGym(gymid)
const grades = useProfileGrades(gymid)
const problems = useProfileProblems(gymid)
const problemList = computed(() => Object.values(problems.value))

// Both payloads feed every number on the page. Until the ticks arrive, a
// loaded gym would read as 0% climbed and then jump.
const { isLoading: profileLoading } = useQuery({ ...queries.profile(gymid), select: () => null })
const { isLoading: ticksLoading } = useQuery({ ...queries.allTimeTicks(), select: () => null })
const loading = computed(() => profileLoading.value || ticksLoading.value)

const openProblem = (problem) => {
  props.f7router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem },
  })
}
</script>
