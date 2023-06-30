<template>
  <Alert v-if="expiringProblems.length > 0" variant="danger" class="my-1 mx-2">
     <div class="flex justify-between"><span class="text-red-500">{{ expiringProblems.length }} expiring problems!</span><a href="#" @click.prevent="toggleDetails">click for details</a></div>
      <div v-if="showDetails" class="my-1 mx-2 text-gray-100">
        <ul>
          <li  class="grid grid-cols-6 font-bold text-gray-400 my-1">
             <span>Problem</span>
             <span>Wall</span>
             <span>Grade</span>
             <span>Colour</span>
             <span>When</span>
          </li>
          <li v-for="problem in expiringProblems" :key="problem.id" class="grid grid-cols-6 ">
            <span class="font-bold text-lg uppercase">{{ right(problem.tag,-7) }} </span>
            <span class="font-bold text-lg">{{ problem.wall.wallchar }} </span>
            <span>{{ problem.grade.name }} </span>
            <round-badge :width="20" :bgColor="problem.colour?.code"></round-badge>
            <span v-if="problem.removal_date != null" class="items-end col-span-2">{{ date_format(problem.removal_date) }}</span><span v-else>Soon</span>
          </li>
        </ul>
      </div>

  </Alert>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import {  computed, ref } from 'vue'
import { Alert } from '@/problemator-ui'
import { date_format, right } from '@js/helpers'
import RoundBadge from '@components/ui/RoundBadge.vue'

const { t } = useI18n()
const store = useStore()
const problems = computed(() => store.state.problems)
const showDetails = ref(false)

const expiringProblems = computed(() => {
  let probs = Object.keys(problems.value).map(key => problems.value[key])
  if (probs== null) {
  return []
  }
  return probs.filter(p => p.soontoberemoved == 1 )
})
const toggleDetails = () => {
  showDetails.value =!showDetails.value

}
</script>
