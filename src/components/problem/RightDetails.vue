<template>
  <div class="col-span-2 px-4 py-2">
      <!-- Details title -->
      <h2 class="flex items-center justify-center gap-1 font-bold text-lg mb-3" style="color: var(--p-text);">
        <span v-if="problem.routetype == 'sport'">
          {{ t('problem.route ') }}
        </span>
        <span v-else>
          {{ t('problem.problem') }}
        </span>
        &nbsp;{{ getTagShort(problem.tag) }}
        <small class="text-xs" style="color: var(--p-text-dim);">#{{ problem.id }}</small>
      </h2>

      <list-styles class="mb-3" :styles="problem.styles"></list-styles>

    <!-- Detail rows -->
    <div class="detail-row">
      <span class="detail-label">{{ t('problem.start') }} / {{ t('problem.end') }}</span>
      <span class="detail-value">{{ problem.startdefinition }} / {{ problem.enddefinition }}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">{{ t('problem.wall') }}</span>
      <span class="detail-value">
        <span class="font-bold">{{ problem.wall?.wallchar }}</span>
        {{ problem.wall?.walldesc }}
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">{{ t('problem.routesetter') }}</span>
      <span class="detail-value">
        {{ problem.author?.etunimi }} {{ left(problem.author?.sukunimi,1) }}.
        <br />
        <span style="color: var(--p-text-dim); font-size: 0.75rem;">{{ fromNow(problem.added) }}</span>
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">{{ t('problem.notes') }}</span>
      <span class="detail-value" v-html="problem.addt || 'N/A'"></span>
    </div>

    <!-- Grade opinions -->
    <div class="mt-4">
      <div class="p-section-title">{{ t('problem.grade_opinions') }}</div>
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

<style scoped>
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--p-border);
  font-size: 0.85rem;
}
.detail-row:last-of-type {
  border-bottom: none;
}
.detail-label {
  font-weight: 600;
  color: var(--p-text-muted);
  flex-shrink: 0;
  margin-right: 0.75rem;
}
.detail-value {
  text-align: right;
  color: var(--p-text-secondary);
}
</style>
