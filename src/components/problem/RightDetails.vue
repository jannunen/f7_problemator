<template>
  <div class="col-span-2 p-4">
    <!-- Show author and addition date -->
    <strong v-if="problem.routetype == 'boulder'">{{ t('problem.problem_info') }}</strong>
    <strong v-if="problem.routetype == 'sport'">{{ t('problem.route_info') }}</strong>
    <div class="my-2 flex flex-row justify-between">
      <span class="">{{ problem.author }}</span>
      <span class="">{{ fromNow(problem.added) }}</span>
    </div>
    <!-- Show additional details -->
    <div class="my-2 flex flex-row justify-between">
      <span class="font-bold">{{ t('problem.notes') }}</span>
      <span class="" v-html="problem.addt || 'N/A'"></span>
    </div>

    <!-- Show grade opinions -->
    <div class="my-2">
      <div>{{ t('problem.grade_opinions') }}</div>
      <grade-opinions
        :grades="cutGrades(grades, problem.grade.id, leaveOnBothSides)"
        :opinions="
          cutOpinions(problem.grade_opinions, problem.grade.id, leaveOnBothSides)
        "
      ></grade-opinions>
    </div>
    
    
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { useStore } from "framework7-vue";
import { getTagShort } from '@js/helpers'
import { ref, onMounted, computed } from "vue";
import GradeOpinions from "@components/ui/problem/GradeOpinions.vue";
import { fromNow } from '@helpers/filters.js'
const { t } = useI18n()

const leaveOnBothSides = ref(3);
const grades = useStore('grades');
const props = defineProps({
  problem: Object,
})
const cutOpinions = (opinions, cutAt, leave) => {
  // Find first the index of cutAt and slice accordingly
  if (opinions == null) {
    return []
  }
  const idx = opinions.findIndex((item) => item.gradeid == cutAt)
  const start = Math.max(0, idx - leave)
  const end = Math.min(opinions.length - 1, idx + leave)
  return opinions.slice(start, end)
}
const cutGrades = (grades, cutAt, leave) => {
  if (grades == null) {
    return []
  }
  // Find first the index of cutAt and slice accordingly
  const idx = grades.findIndex((item) => item.id == cutAt)
  const start = Math.max(0, idx - leave)
  const end = Math.min(grades.length - 1, idx + leave)
  return grades.slice(start, end)
}
</script>

<style></style>
