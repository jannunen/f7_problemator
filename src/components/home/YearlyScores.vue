<template>
  <div class="p-card">
    <div class="flex items-center justify-between mb-3">
      <div class="p-card__title mb-0">{{ t('yearly_scores.title') }}</div>
    </div>

    <!-- Loaded state -->
    <div v-if="loaded">
      <div v-if="years.length > 0">

        <!-- Chart -->
        <div class="mb-4">
          <Line
            :chart-data="chartData"
            :chart-options="chartOptions"
            chart-id="yearly_scores"
            :width="300"
            :height="160"
          />
        </div>

        <!-- Legend -->
        <div class="flex justify-center gap-4 mb-3">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="ys-legend-dot" style="background: #38bdf8;"></span>
            {{ t('yearly_scores.all') }}
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="ys-legend-dot" style="background: #f97316;"></span>
            {{ t('yearly_scores.boulder') }}
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="ys-legend-dot" style="background: #a78bfa;"></span>
            {{ t('yearly_scores.sport') }}
          </div>
        </div>

        <!-- Data table -->
        <div class="ys-header">
          <div class="ys-header__year"></div>
          <div class="ys-header__col">{{ t('yearly_scores.all') }}</div>
          <div class="ys-header__col">{{ t('yearly_scores.boulder') }}</div>
          <div class="ys-header__col">{{ t('yearly_scores.sport') }}</div>
        </div>

        <div class="ys-rows-scroll">
          <div
            v-for="year in years"
            :key="year"
            class="ys-row"
            :class="{ 'ys-row--current': year == currentYear }"
          >
            <div class="ys-row__year">
              {{ year }}
              <span v-if="year == currentYear" class="ys-row__live">{{ t('yearly_scores.live') }}</span>
            </div>
            <div class="ys-row__score">
              <span class="ys-row__points">{{ scores[year]?.all?.points || '—' }}</span>
            </div>
            <div class="ys-row__score">
              <span class="ys-row__points">{{ scores[year]?.boulder?.points || '—' }}</span>
            </div>
            <div class="ys-row__score">
              <span class="ys-row__points">{{ scores[year]?.sport?.points || '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-4">
        <span class="material-icons p-text-dim" style="font-size: 32px;">trending_up</span>
        <div class="text-sm mt-2 p-text-muted">{{ t('yearly_scores.empty') }}</div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-else class="text-center py-4">
      <div class="p-spinner"></div>
      <div class="text-sm mt-2 p-text-muted">{{ t('global.loading') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import axios from 'axios'
import { endpoint } from '@js/api'
import { Line } from 'vue-chartjs'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const { t } = useI18n()
const store = useStore()

const scores = ref({})
const loaded = ref(false)
const currentYear = new Date().getFullYear()

const climberId = computed(() => store.state.climber?.id)

const years = computed(() =>
  Object.keys(scores.value)
    .map(Number)
    .sort((a, b) => b - a)
)

// Years sorted ascending for chart x-axis
const yearsSorted = computed(() => [...years.value].sort((a, b) => a - b))

const chartData = computed(() => ({
  labels: yearsSorted.value.map(String),
  datasets: [
    {
      label: t('yearly_scores.all'),
      data: yearsSorted.value.map(y => scores.value[y]?.all?.points || 0),
      borderColor: '#38bdf8',
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#38bdf8',
      borderWidth: 2,
    },
    {
      label: t('yearly_scores.boulder'),
      data: yearsSorted.value.map(y => scores.value[y]?.boulder?.points || 0),
      borderColor: '#f97316',
      backgroundColor: 'rgba(249, 115, 22, 0.08)',
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#f97316',
      borderWidth: 2,
    },
    {
      label: t('yearly_scores.sport'),
      data: yearsSorted.value.map(y => scores.value[y]?.sport?.points || 0),
      borderColor: '#a78bfa',
      backgroundColor: 'rgba(167, 139, 250, 0.08)',
      fill: false,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#a78bfa',
      borderWidth: 2,
    },
  ],
}))

const chartOptions = {
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
}

const fetchScores = async () => {
  if (!climberId.value) return
  try {
    const ret = await axios.get(endpoint + `/climber/yearly-scores?climber_id=${climberId.value}`)
    scores.value = ret.data.data || {}
  } catch (e) {
    scores.value = {}
  }
  loaded.value = true
}

onMounted(fetchScores)
</script>

<style scoped>
.ys-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.ys-rows-scroll {
  max-height: 168px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.ys-header {
  display: grid;
  grid-template-columns: 72px 1fr 1fr 1fr;
  gap: 4px;
  padding-bottom: 6px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--p-border);
}

.ys-header__col {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--p-text-muted);
  text-align: center;
}

.ys-row {
  display: grid;
  grid-template-columns: 72px 1fr 1fr 1fr;
  gap: 4px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--p-border);
}

.ys-row:last-child {
  border-bottom: none;
}

.ys-row--current {
  background: var(--p-accent-bg, rgba(59, 130, 246, 0.06));
  border-radius: 6px;
  margin: 2px -8px;
  padding: 8px 8px;
}

.ys-row__year {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ys-row__live {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-accent, #3b82f6);
  opacity: 0.8;
}

.ys-row__score {
  text-align: center;
}

.ys-row__points {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
