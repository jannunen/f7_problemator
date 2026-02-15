<template>
  <div v-if="expiringProblems.length > 0" class="p-banner p-banner--warning mx-4 my-2">
    <span class="material-icons p-banner__icon" style="color: #f59e0b;">warning</span>
    <div class="p-banner__content">
      <div class="flex justify-between items-center">
        <span class="font-semibold">{{ expiringProblems.length }} expiring problems!</span>
        <a href="#" class="p-link text-sm" @click.prevent="toggleDetails">{{ showDetails ? 'hide' : 'details' }}</a>
      </div>
      <div v-if="showDetails" class="mt-3">
        <div class="grid grid-cols-6 text-xs font-semibold mb-1" style="color: var(--p-text-muted);">
          <span>Problem</span>
          <span>Wall</span>
          <span>Grade</span>
          <span>Colour</span>
          <span class="col-span-2">When</span>
        </div>
        <div v-for="problem in expiringProblems" :key="problem.id" class="grid grid-cols-6 items-center py-1 text-sm" style="border-bottom: 1px solid var(--p-border);">
          <span class="font-bold uppercase">{{ right(problem.tag,-7) }}</span>
          <span class="font-bold">{{ problem.wall.wallchar }}</span>
          <span>{{ problem.grade.name }}</span>
          <round-badge :width="20" :bgColor="problem.colour?.code"></round-badge>
          <span v-if="problem.removal_date != null" class="col-span-2 text-xs">{{ date_format(problem.removal_date) }}</span>
          <span v-else class="col-span-2 text-xs" style="color: var(--p-text-muted);">Soon</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import {  computed, ref } from 'vue'
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
