<template>
  <div v-if="chartLabels.length > 0" class="p-card">
    <div class="p-card__title mb-3">{{ t('attribute_radar.title') }}</div>
    <div class="radar-chart-container">
      <Radar v-if="radarData" :key="chartLabels.length" :chart-data="radarData" :chart-options="radarOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const store = useStore()
const { t } = useI18n()

const ticks = computed(() => store.state.alltime.ticks || [])
const problems = computed(() => store.state.problems || {})
const styles = computed(() => store.state.styles || [])

// Set of problem IDs the user has ticked
const tickedIds = computed(() => new Set(ticks.value.map((tick) => String(tick.problemid))))

// Count styles separately for ticked and unticked problems
const styleCounts = computed(() => {
  if (!styles.value.length) return { ticked: {}, unticked: {} }

  const ticked = {}
  const unticked = {}
  styles.value.forEach((s) => {
    ticked[s] = 0
    unticked[s] = 0
  })

  // Count from all problems
  const allProblems = problems.value
  for (const id in allProblems) {
    const problem = allProblems[id]
    if (!problem || !problem.styles) continue
    const isTicked = tickedIds.value.has(String(id))
    problem.styles.forEach((s) => {
      if (s in ticked) {
        if (isTicked) ticked[s]++
        else unticked[s]++
      }
    })
  }

  return { ticked, unticked }
})

// Pick top styles by total (ticked + unticked) to show on the radar axes
const chartLabels = computed(() => {
  const { ticked, unticked } = styleCounts.value
  if (!styles.value.length) return []

  const entries = styles.value
    .map((s) => ({
      key: s,
      label: t(s),
      ticked: ticked[s] || 0,
      unticked: unticked[s] || 0,
      total: (ticked[s] || 0) + (unticked[s] || 0),
    }))
    .filter((e) => e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return entries
})

// Normalize each dataset to 0–100% of its own max so the shapes are
// visually comparable even when the user has very few ticks.
const radarData = computed(() => {
  if (!chartLabels.value.length) return null

  const maxTicked = Math.max(...chartLabels.value.map((d) => d.ticked), 1)
  const maxUnticked = Math.max(...chartLabels.value.map((d) => d.unticked), 1)

  return {
    labels: chartLabels.value.map((d) => d.label),
    datasets: [
      {
        label: t('attribute_radar.ticked'),
        data: chartLabels.value.map((d) => (d.ticked / maxTicked) * 100),
        rawCounts: chartLabels.value.map((d) => d.ticked),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        pointBackgroundColor: '#f59e0b',
        pointRadius: 3,
      },
      {
        label: t('attribute_radar.unticked'),
        data: chartLabels.value.map((d) => (d.unticked / maxUnticked) * 100),
        rawCounts: chartLabels.value.map((d) => d.unticked),
        backgroundColor: 'rgba(100, 116, 139, 0.1)',
        borderColor: '#64748b',
        borderWidth: 1,
        borderDash: [4, 3],
        pointBackgroundColor: '#64748b',
        pointRadius: 2,
      },
    ],
  }
})

const radarOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        color: 'var(--p-text-secondary, #94a3b8)',
        font: { size: 10 },
        boxWidth: 12,
        padding: 8,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const raw = ctx.dataset.rawCounts?.[ctx.dataIndex] ?? ctx.raw
          return `${ctx.dataset.label}: ${raw}`
        },
      },
    },
  },
  scales: {
    r: {
      beginAtZero: true,
      min: 0,
      max: 100,
      ticks: { display: false },
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
      },
      angleLines: {
        color: 'rgba(148, 163, 184, 0.1)',
      },
      pointLabels: {
        color: 'var(--p-text-secondary, #94a3b8)',
        font: { size: 10, weight: 500 },
        callback: (label, index) => {
          const entry = chartLabels.value[index]
          const truncated = label.length > 14 ? label.slice(0, 12) + '...' : label
          return `${truncated} (${entry?.ticked ?? 0}/${entry?.total ?? 0})`
        },
      },
    },
  },
}))
</script>

<style scoped>
.radar-chart-container {
  max-width: 320px;
  margin: 0 auto;
}
</style>
