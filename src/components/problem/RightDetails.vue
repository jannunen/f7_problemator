<template>
  <div class="col-span-2 px-4 py-1">
      <!-- Details title -->
      <h2 class="flex flex-row justify-center font-bold text-xl">
        <span v-if="problem.routetype == 'sport'">
          {{ t('problem.route ') }}
        </span>
        <span v-else>
          {{ t('problem.problem') }}
        </span>
        &nbsp;{{ getTagShort(problem.tag) }}
        <small class="mx-2 pt-1 text-sm text-gray-700"
          ><small>#{{ problem.id }}</small></small
        >
      </h2>

    <!-- Show author and addition date -->
    <!--
    <div class="text-lg font-bold text-center my-3" v-if="problem.routetype == 'boulder'">{{ t('problem.problem_info') }}</div>
    <div class="text-lg font-bold text-center my-3" v-if="problem.routetype == 'sport'">{{ t('problem.route_info') }}</div>
      <div class="my-2 text-sm text-center font-bold"> {{ t('problem.attributes') }} </div>
    -->
      <list-styles class="my-2" :styles="problem.styles"></list-styles>
    <div class="my-2 flex flex-row justify-between">
      <strong class="">{{ t('problem.start') }}</strong>
      <span class="">
        {{ problem.startdefinition }}</span>
    </div>
    <div class="my-2 flex flex-row justify-between">
      <strong class="">{{ t('problem.start') }}</strong>
      <span class="">
        {{ problem.enddefinition }}</span>
    </div>
    <div class="my-2 flex flex-row justify-between">
      <strong class="">{{ t('problem.wall') }}</strong>
      <span class="">
        <span class="font-bold">{{ problem.wall.wallchar }}</span>,
        {{ problem.wall.walldesc }}</span>
    </div>
    <div class="my-2 flex flex-row justify-between">
      <strong class="">{{ t('problem.routesetter') }}</strong>
      <span class="">
        {{ problem.author.etunimi }} {{ left(problem.author.sukunimi,1) }}.<br />
        {{ fromNow(problem.added) }}</span>
    </div>
    <!-- Show additional details -->
    <div class="my-2 flex flex-row justify-between">
      <span class="font-bold">{{ t('problem.notes') }}</span>
      <span class="" v-html="problem.addt || 'N/A'"></span>
    </div>

    <!-- Show grade opinions -->
    <div class="my-2">
      <div class="font-bold">{{ t('problem.grade_opinions') }}</div>
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
import { left, getTagShort } from '@js/helpers'
import { ref, onMounted, computed } from "vue";
import GradeOpinions from "@components/ui/problem/GradeOpinions.vue";
import ListStyles from '@components/ui/problem/ListStyles.vue'
import { fromNow } from '@helpers/filters.js'
const { t } = useI18n()

const leaveOnBothSides = ref(3);
const grades = computed(() => store.state.grades)

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
