<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left>
        <f7-link href="/home">&lt; back</f7-link>
      </f7-nav-left>
      <f7-nav-title> {{ t('gym.gym_completion_title') }} </f7-nav-title>
    </f7-navbar>
  </f7-page>
  <f7-block>
  <completion-bar-chart :width="400" :height="300" :data="getActiveProblemsByGrade" />
  </f7-block>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { watch, onMounted, computed } from 'vue'
import CompletionBarChart from '@components/gym_completion/CompletionBarChart.vue'

const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
const store = useStore()
const ticks = computed(() => store.state.alltime.ticks)
const problems = computed(() => store.state.problems)
const grades = computed(() => store.state.grades)

// Find out how many problems there are for a grade and how many problems
// the user has climbed.
const getActiveProblemsByGrade = computed(() => {
  // Use map, it handles uniqueness well
  let gradeMap = new Map()
  let tickedGradeMap = new Map()
  // Setup grademaps first.
  grades.value.forEach(g => {
    gradeMap.set(g.id, 0)
    tickedGradeMap.set(g.id, 0)
  })

  if (Object.keys(problems.value).length > 0) {
    Object.keys(problems.value).forEach(probId => {

      const prob = problems.value[probId]
      const gradeId = prob.grade.id
      gradeMap.set(gradeId, gradeMap.get(gradeId) + 1)

      // Check if user has ticked the problem and add accordingly
      const hasTick = ticks.value.find(x => x.id == prob.id)
      if (hasTick != null) {
        tickedGradeMap.set(hasTick.gradeid, tickedGradeMap.get(hasTick.gradeid) + 1)
      }
    })
    /* these must be returned as in format:
    [
      {grade : "6a+",available : 10, done: 8}
    ]
    */
    return grades.value.map(g => {
      return {
        id : g.id,
        grade: g.name,
        available: gradeMap.get(g.id),
        done: tickedGradeMap.get(g.id),
      }
    })
  }
})

</script>