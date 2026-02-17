<template>
  <f7-popup :opened="opened" @popup:closed="emit('update:opened', false)">
    <f7-page>
      <f7-navbar title="Top10 ascents for ranking">
        <f7-nav-right>
          <f7-link @click="emit('close')" popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <div class="p-spinner" style="width: 32px; height: 32px;"></div>
        <div class="text-sm mt-3 p-text-muted">Loading...</div>
      </div>

      <!-- Climber top10 detail -->
      <div class="px-4 py-3" v-if="climber_id != null && !loading">
        <h2 class="text-xl uppercase text-center font-bold mb-3" style="color: var(--p-text);">{{ props.first }} {{ props.last }}</h2>
        <a class="p-btn p-btn--primary p-btn--block mb-4" :href="climberProfileLink(climber_id)">
          <span class="material-icons" style="font-size: 18px;">person</span>
          Open profile
        </a>

        <div v-if="ranking != null && ranking.id != null">
          <div class="p-section-title mb-2">Rank consists of {{ ranking.problems.length }} problem(s)</div>

          <!-- Problem list -->
          <div class="top10-list">
            <div
              v-for="(problem, index) in ranking.problems"
              :key="problem.id"
              class="top10-row"
            >
              <!-- Rank + tag -->
              <div class="top10-rank">
                <span class="top10-rank__num">{{ index + 1 }}</span>
                <span class="top10-rank__tag">{{ right(problem.tag, 4) }}</span>
              </div>

              <!-- Grade + details -->
              <div class="top10-info">
                <div class="top10-grade">{{ problem.grade.name }}</div>
                <div class="top10-meta">
                  <span style="color: var(--p-success);">{{ getFirstTickTimestamp(problem) }}</span>
                  <span class="p-text-dim">@{{ problem.gym.name }}</span>
                </div>
                <div class="top10-meta">
                  <span class="font-semibold">{{ problem.routetype }}</span>
                  <span class="p-text-dim">| base: {{ problem.grade.score }}</span>
                </div>
              </div>

              <!-- Points -->
              <div class="top10-points">
                <div class="text-xs" style="color: var(--p-text-muted);">
                  {{ problem.total_tries }} {{ t('ranking.tries') }}
                </div>
                <div class="top10-points__score">
                  {{ problem.grade.score }}
                  {{ getChange(problem, true) }}
                  = {{ getPoints(problem) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="top10-summary">
            <div class="top10-summary__row">
              <span class="p-text-muted">Total points</span>
              <span class="top10-summary__value">{{ ranking.points }}</span>
            </div>
            <div class="top10-summary__row">
              <span class="p-text-muted">Avg grade (grades)</span>
              <span class="top10-summary__value">{{ estimateGrade(getScore(ranking.problems), grades) }}</span>
            </div>
            <div class="top10-summary__row">
              <span class="p-text-muted">Avg grade (scores)</span>
              <span class="top10-summary__value">{{ estimateGrade(ranking.points, grades) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 p-text-muted text-sm">No ascents</div>
      </div>
    </f7-page>
  </f7-popup>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { right } from '@js/helpers'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'
import api from '@js/api'
const { t } = useI18n()
const props = defineProps({
  opened: Boolean,
  climber_id: Number,
  country: String,
  ranking_id: Number,
  first : String,
  last : String,
})

const emit = defineEmits(['close', 'update:opened'])
const store = useStore()

const { data: ranking, isLoading: loading } = useQuery({
  queryKey: ['rankingTop10', props.climber_id, props.ranking_id, props.country],
  queryFn: () => api.rankingtop10({
    climber_id: props.climber_id,
    country: props.country,
    ranking_id: props.ranking_id,
  }),
})

const grades = computed(() => store.state.grades)
const getFirstTickTimestamp = (problem) => {
  return toLocalTime(problem.ascent_tstamp, 'YYYY-MM-DD')
}
const climberProfileLink = (row) => {
  return '/climber/' + props.climber_id
}
const getScore = (problems) => {
  return problems.reduce((acc, x) => acc + x.grade.score, 0)
}
const getChange = (problem, withPrefix = false) => {
  const totalTries = problem.total_tries
  if (withPrefix) {
    const change = calculatePoints(problem.routetype, totalTries)
    if (change > 0) {
      return '+ ' + change
    } else {
      return '- ' + Math.abs(change)
    }
  } else {
    return calculatePoints(problem.routetype, totalTries)
  }
}
const getPoints = (problem) => {
  return problem.grade.score + getChange(problem)
}
</script>
<style scoped>
.top10-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.top10-row {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--p-border);
}
.top10-row:last-child {
  border-bottom: none;
}
.top10-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 32px;
  flex-shrink: 0;
}
.top10-rank__num {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--p-text-muted);
}
.top10-rank__tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-text-dim);
}
.top10-info {
  flex: 1;
  min-width: 0;
}
.top10-grade {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--p-text);
  line-height: 1.2;
}
.top10-meta {
  font-size: 0.75rem;
  line-height: 1.5;
  display: flex;
  gap: 0.375rem;
}
.top10-points {
  text-align: right;
  flex-shrink: 0;
}
.top10-points__score {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fbbf24;
}
.top10-summary {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--p-bg-card);
  border: 1px solid var(--p-border);
  border-radius: 10px;
}
.top10-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0;
  font-size: 0.85rem;
}
.top10-summary__row + .top10-summary__row {
  border-top: 1px solid var(--p-border);
}
.top10-summary__value {
  font-size: 1rem;
  font-weight: 700;
  color: #fbbf24;
}
</style>
