<template>
    <!-- Top10 popup — keep f7-popup for gesture/backdrop -->
    <f7-popup v-model:opened="showAscents">
    <f7-page>
      <f7-navbar title="Top10 ascents for ranking">
        <f7-nav-right>
          <f7-link @click="closeTop10Popup" popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <div class="p-spinner" style="width: 32px; height: 32px;"></div>
        <div class="text-sm mt-3 p-text-muted">Loading...</div>
      </div>

      <!-- Climber top10 detail -->
      <div class="px-4 py-3" v-if="climber != null && !loading">
        <h2 class="text-xl uppercase text-center font-bold mb-3">{{ first }} {{ last }}</h2>
        <a class="p-btn p-btn--primary p-btn--block mb-4" @click="closeTop10Popup" :href="climberProfileLink(climber)">
          <span class="material-icons" style="font-size: 18px;">person</span>
          Open profile
        </a>

        <div v-if="rankingtop10 != null && rankingtop10.id != null">
          <div class="p-section-title mb-2">Rank consists of {{ rankingtop10.problems.length }} problem(s)</div>

          <!-- Problem list -->
          <div class="top10-list">
            <div
              v-for="(problem, index) in rankingtop10.problems"
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
                  <span class="p-text-success">{{ getFirstTickTimestamp(problem) }}</span>
                  <span class="p-text-dim">@{{ problem.gym.name }}</span>
                </div>
                <div class="top10-meta">
                  <span class="font-semibold">{{ problem.routetype }}</span>
                  <span class="p-text-dim">| base: {{ problem.grade.score }}</span>
                </div>
              </div>

              <!-- Points -->
              <div class="top10-points">
                <div class="text-xs p-text-muted">
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

          <!-- Totals -->
          <div class="top10-summary">
            <div class="top10-summary__row">
              <span class="p-text-muted">Total points</span>
              <span class="top10-summary__value">{{ rankingtop10.points }}</span>
            </div>
            <div class="top10-summary__row">
              <span class="p-text-muted">Avg grade (grades)</span>
              <span class="top10-summary__value">{{ estimateGrade(getScore(rankingtop10.problems), grades) }}</span>
            </div>
            <div class="top10-summary__row">
              <span class="p-text-muted">Avg grade (scores)</span>
              <span class="top10-summary__value">{{ estimateGrade(rankingtop10.points, grades) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 p-text-muted text-sm">No ascents</div>
      </div>
    </f7-page>
  </f7-popup>

  <!-- Ranking list -->
  <div>
    <div class="ranking-list">
      <div
        v-for="row in pagination.data"
        :key="row.climber_id"
        class="ranking-row"
        @click="openTop10(row)"
      >
        <!-- Rank number -->
        <div class="ranking-row__rank">
          <span class="ranking-row__rank-num">{{ row.rank }}</span>
          <span v-if="country && country !== 'global' && row.global_rank" class="ranking-row__global">#{{ row.global_rank }}</span>
        </div>

        <!-- Climber name -->
        <div class="ranking-row__name">
          {{ getClimberName(row) }}
          <span class="material-icons ranking-row__arrow">chevron_right</span>
        </div>

        <!-- Points + estimated grade -->
        <div class="ranking-row__score">
          <span class="ranking-row__points">{{ row.points }}</span>
          <span class="ranking-row__grade">~{{ estimateGrade(row.points, grades) }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button class="pagination__btn" @click="loadRanking(pagination.first_page_url)">
        <span class="material-icons" style="font-size: 18px;">first_page</span>
      </button>
      <button class="pagination__btn" @click="loadRanking(pagination.prev_page_url)">
        <span class="material-icons" style="font-size: 18px;">chevron_left</span>
      </button>
      <span class="pagination__info">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
      <button class="pagination__btn" @click="loadRanking(pagination.next_page_url)">
        <span class="material-icons" style="font-size: 18px;">chevron_right</span>
      </button>
      <button class="pagination__btn" @click="loadRanking(pagination.last_page_url)">
        <span class="material-icons" style="font-size: 18px;">last_page</span>
      </button>
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { right } from '@js/helpers'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'


const props = defineProps({
    'ranking': Object,
    'country': String,
})

const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const showAscents = ref(false)
const user = computed(() => store.state.climber)
const showMyTop10 = () => {
    climber.value = user.value.id
    showAscents.value = true
}
const closeTop10Popup = () => {
    showAscents.value = false
    climber.value = null
    first.value = null
    last.value = null
}
const getClimberName = (row) => {
    if (row.etunimi == null && row.sukunimi == null) {
        return "Secret Nugget"
    }
    return row.etunimi + ' ' + row.sukunimi
}
const loadRanking = (url) => {
    store.dispatch('rankings', { url, country: props.country })
}
const pagination = computed(() => props.ranking.pagination)
const climber = ref(null)
const first = ref(null)
const last = ref(null)
const myRank = computed(() => props.ranking.myrank)

const { data: rankingtop10, isLoading: loading } = useQuery({
  queryKey: computed(() => ['rankingTop10', climber.value, props.ranking.ranking.id, props.country]),
  queryFn: () => api.rankingtop10({
    climber_id: climber.value,
    country: props.country,
    ranking_id: props.ranking.ranking.id,
  }),
  enabled: computed(() => climber.value != null),
})

const openTop10 = (row) => {
    climber.value = row.climber_id
    showAscents.value = true
    first.value = row.etunimi
    last.value = row.sukunimi
}
const getFirstTickTimestamp = (problem) => {
  return toLocalTime(problem.ascent_tstamp, 'YYYY-MM-DD')
}
const climberProfileLink = (id) => {
  return '/climber/' + id
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
/* ---- Ranking list ---- */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 0.5rem;
}
.ranking-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.5rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.ranking-row:hover,
.ranking-row:active {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--p-border);
}
.ranking-row__rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 32px;
  flex-shrink: 0;
}
.ranking-row__rank-num {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--p-text-muted);
}
.ranking-row__global {
  font-size: 0.6rem;
  color: var(--p-text-dim);
}
.ranking-row__name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--p-accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranking-row__arrow {
  font-size: 16px;
  opacity: 0.4;
  flex-shrink: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.ranking-row:hover .ranking-row__arrow,
.ranking-row:active .ranking-row__arrow {
  opacity: 0.8;
  transform: translateX(2px);
}
.ranking-row__score {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-shrink: 0;
}
.ranking-row__points {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fbbf24;
}
.ranking-row__grade {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--p-text);
  min-width: 2rem;
  text-align: right;
}

/* ---- Pagination ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--p-border);
}
.pagination__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--p-border-light);
  background: rgba(255, 255, 255, 0.03);
  color: var(--p-accent);
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.pagination__btn:hover {
  background: rgba(var(--p-accent-rgb), 0.1);
}
.pagination__btn:active {
  transform: scale(0.95);
}
.pagination__info {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-muted);
  padding: 0 0.75rem;
}

/* ---- Top10 popup content ---- */
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

/* ---- Top10 summary ---- */
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
