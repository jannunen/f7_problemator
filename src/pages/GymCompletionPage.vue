<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/home">&lt; back</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('gym.gym_completion_title') }} </f7-nav-title>
    </f7-navbar>
  <f7-block>
    <div class="completion-filter">
      <button
        v-for="opt in filterOptions"
        :key="opt.value"
        class="completion-filter__btn"
        :class="{ 'completion-filter__btn--active': routeTypeFilter === opt.value }"
        @click="routeTypeFilter = opt.value"
      >{{ opt.label }}</button>
    </div>
    <div v-if="getActiveProblemsByGrade != null" >
    <completion-bar-chart :data="getActiveProblemsByGrade" />
    </div>
    <div v-else>
      No data
      </div>
  </f7-block>
  </f7-page>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
import CompletionBarChart from '@components/gym_completion/CompletionBarChart.vue'

const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
const store = useStore()
const ticks = computed(() => store.state.alltime.ticks)
const problems = computed(() => store.state.problems)
const grades = computed(() => store.state.grades)

const routeTypeFilter = ref('all')
const filterOptions = [
  { value: 'all', label: t('gym.all', 'All') },
  { value: 'boulder', label: t('gym.boulder', 'Boulder') },
  { value: 'sport', label: t('gym.sport', 'Sport') },
]

// Find out how many problems there are for a grade and how many problems
// the user has climbed.
const getActiveProblemsByGrade = computed(() => {
  let gradeMap = new Map()
  let tickedGradeMap = new Map()
  grades.value.forEach(g => {
    gradeMap.set(g.id, 0)
    tickedGradeMap.set(g.id, 0)
  })

  if (Object.keys(problems.value).length > 0) {
    Object.keys(problems.value).forEach(probId => {
      const prob = problems.value[probId]
      const matchesFilter =
        routeTypeFilter.value === 'all' || prob.routetype === routeTypeFilter.value
      // grade is nullable — an ungraded problem would have thrown here.
      if (!matchesFilter || prob.grade == null) {
        return undefined
      }

      const gradeId = prob.grade.id
      gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)

      const hasTick = ticks.value.find(x => x.id == prob.id)
      if (hasTick != null) {
        tickedGradeMap.set(hasTick.gradeid, tickedGradeMap.get(hasTick.gradeid) + 1)
      }
    })
    return grades.value.map(g => {
      return {
        group: g.name,
        available: gradeMap.get(g.id)-tickedGradeMap.get(g.id),
        done: tickedGradeMap.get(g.id),
      }
    })
  }
  // A gym with no problems loaded yet fell out of the bottom returning
  // undefined, so the chart got undefined instead of an empty series.
  return []
})

</script>
<style scoped>
.completion-filter {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 3px;
}
.completion-filter__btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--p-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.completion-filter__btn--active {
  background: rgba(255, 255, 255, 0.12);
  color: var(--p-text);
}
</style>