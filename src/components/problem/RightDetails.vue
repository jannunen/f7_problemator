<template>
  <div class="col-span-2 p-4">
    <!-- Show author and addition date -->
    <strong v-if="problem.routetype == 'boulder'">{{
      $t('problem.problem_info')
    }}</strong>
    <strong v-if="problem.routetype == 'sport'">{{ $t('problem.route_info') }}</strong>
    <div class="my-2 flex flex-row justify-between">
      <span class="">{{ problem.author }}</span>
      <span class="">{{ $filters.fromNow(problem.added) }}</span>
    </div>
    <!-- Show additional details -->
    <div class="my-2 flex flex-row justify-between">
      <span class="font-bold">{{ $t('problem.notes') }}</span>
      <span class="" v-html="problem.addt || 'N/A'"></span>
    </div>

    <!-- Show grade opinions -->
    <div class="my-2">
      <div>{{ $t('problem.grade_opinions') }}</div>
      <grade-opinions
        :grades="cutGrades(grades, problem.grade.id, leaveOnBothSides)"
        :opinions="
          cutOpinions(problem.grade_opinions, problem.grade.id, leaveOnBothSides)
        "
      ></grade-opinions>
    </div>
    <!-- Show dislikes -->
    <div class="my-2 flex-col">
      <div class="my-2">
        {{ $tc('problem.dislikes', problem.dislikeCount) }}
      </div>
      <div class="font-bold my-2">
        <button class="bg-white text-purple-900" raised>
          <div material="sentiment_dissatisfied"></div>
          {{ $t('problem.dislike') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from "vuex";
import { getTagShort } from '@js/helpers.js'
import { ref, onMounted, computed } from "vue";
import GradeOpinions from "@components/ui/problem/GradeOpinions.vue";

const leaveOnBothSides = ref(3);
const store = useStore();
const grades = store.state.grades;
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
const props = defineProps({
  problem: Object,
})
</script>

<style></style>
