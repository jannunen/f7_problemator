<template>
  <div class="p-card">
    <div class="flex items-center justify-between mb-3">
      <div class="p-card__title mb-0">{{ t('grade_pyramid.title') }}</div>
      <div class="p-toggle-group p-toggle-group--sm">
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': routeType === 'boulder' }"
          @click="routeType = 'boulder'"
        >{{ t('grade_pyramid.boulder') }}</button>
        <button
          class="p-toggle-group__btn"
          :class="{ 'p-toggle-group__btn--active': routeType === 'sport' }"
          @click="routeType = 'sport'"
        >{{ t('grade_pyramid.sport') }}</button>
      </div>
    </div>

    <!-- Time range selector -->
    <div class="flex items-center justify-center gap-1 mb-3 text-sm p-text-muted">
      {{ t('grade_pyramid.last') }}
      <div class="p-dropdown">
        <span class="p-dropdown__trigger" @click="showDaysDropdown = !showDaysDropdown">{{ selectedDayLabel }}</span>
        <div v-if="showDaysDropdown" class="p-dropdown__menu">
          <button
            v-for="opt in dayOptions" :key="opt.value"
            class="p-dropdown__item"
            @click="days = opt.value; showDaysDropdown = false"
          >{{ opt.label }}</button>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex items-center justify-center gap-3 mb-3 text-xs">
      <span class="flex items-center gap-1"><span class="legend-dot legend-onsight"></span>{{ routeType === 'boulder' ? t('grade_pyramid.flash') : t('grade_pyramid.onsight') }}</span>
      <span class="flex items-center gap-1"><span class="legend-dot legend-redpoint"></span>{{ t('grade_pyramid.redpoint') }}</span>
      <span v-if="routeType === 'sport'" class="flex items-center gap-1"><span class="legend-dot legend-toprope"></span>{{ t('grade_pyramid.toprope') }}</span>
    </div>

    <div v-if="pyramidRows.length === 0" class="text-center py-4">
      <span class="material-icons mb-1 p-text-muted" style="font-size: 32px">bar_chart</span>
      <div class="text-sm p-text-muted">{{ t('grade_pyramid.no_ascents') }}</div>
    </div>

    <div v-else class="pyramid">
      <div
        v-for="row in pyramidRows"
        :key="row.gradeId"
        class="pyramid-row"
      >
        <div class="pyramid-label">{{ row.name }}</div>
        <div class="pyramid-bar-track">
          <div class="pyramid-bar-centered" :style="{ width: row.pct + '%' }">
            <div
              v-if="row.onsight > 0"
              class="pyramid-segment pyramid-onsight"
              :style="{ width: segPct(row.onsight, row.count) + '%' }"
            ></div>
            <div
              v-if="row.redpoint > 0"
              class="pyramid-segment pyramid-redpoint"
              :style="{ width: segPct(row.redpoint, row.count) + '%' }"
            ></div>
            <div
              v-if="row.toprope > 0"
              class="pyramid-segment pyramid-toprope"
              :style="{ width: segPct(row.toprope, row.count) + '%' }"
            ></div>
            <span class="pyramid-count">{{ row.count }}</span>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'

const store = useStore()
const { t } = useI18n()
const routeType = ref('boulder')
const days = ref(90)
const showDaysDropdown = ref(false)

const dayOptions = computed(() => [
  { value: 30, label: t('grade_pyramid.days_30') },
  { value: 60, label: t('grade_pyramid.days_60') },
  { value: 90, label: t('grade_pyramid.days_90') },
  { value: 180, label: t('grade_pyramid.months_6') },
  { value: 365, label: t('grade_pyramid.year') },
  { value: 9999, label: t('grade_pyramid.all_time') },
])

const selectedDayLabel = computed(() =>
  dayOptions.value.find(o => o.value === days.value)?.label || days.value + ' ' + t('mylogs.days')
)

const grades = computed(() => store.state.grades || [])
const ticks = computed(() => store.state.alltime.ticks || [])

function segPct(segCount, total) {
  return total > 0 ? Math.round((segCount / total) * 100) : 0
}

const pyramidRows = computed(() => {
  const deadline = days.value < 9999
    ? dayjs().subtract(days.value, 'day')
    : null

  // Count ticks per grade, broken down by ascent style
  // onsight/flash: tries == 1, lead (ascent_type != 1)
  // redpoint: tries > 1, lead (ascent_type != 1)
  // toprope: ascent_type == 1 (sport only)
  const dataMap = new Map()

  ticks.value.forEach(tick => {
    if (tick.routetype !== routeType.value) return
    if (deadline && !dayjs(tick.tstamp).isAfter(deadline)) return

    if (!dataMap.has(tick.gradeid)) {
      dataMap.set(tick.gradeid, { onsight: 0, redpoint: 0, toprope: 0 })
    }
    const entry = dataMap.get(tick.gradeid)
    const isToprope = routeType.value === 'sport' && String(tick.ascent_type) === '1'

    if (isToprope) {
      entry.toprope++
    } else if (parseInt(tick.tries) === 1) {
      entry.onsight++
    } else {
      entry.redpoint++
    }
  })

  if (dataMap.size === 0) return []

  // Build rows from grades that have ticks
  const rows = []
  grades.value.forEach(g => {
    const entry = dataMap.get(g.id)
    if (!entry) return
    const count = entry.onsight + entry.redpoint + entry.toprope
    if (count === 0) return
    rows.push({
      gradeId: g.id,
      name: routeType.value === 'boulder' ? g.name.toUpperCase() : g.name,
      score: g.score || 0,
      count,
      onsight: entry.onsight,
      redpoint: entry.redpoint,
      toprope: entry.toprope,
    })
  })

  // Sort hardest (highest score) on top
  rows.sort((a, b) => b.score - a.score)

  // Calculate bar widths relative to the max count
  const maxCount = Math.max(...rows.map(r => r.count))
  rows.forEach(r => {
    r.pct = Math.max(12, Math.round((r.count / maxCount) * 100))
  })

  return rows
})
</script>

<style scoped>
.pyramid {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pyramid-row {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  height: 22px;
}

.pyramid-label {
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: var(--p-text-secondary, #94a3b8);
  padding-right: 6px;
}

.pyramid-bar-track {
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pyramid-bar-centered {
  height: 100%;
  display: flex;
  align-items: center;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  transition: width 0.3s ease;
}

.pyramid-segment {
  height: 100%;
  min-width: 0;
}

.pyramid-onsight {
  background: #f59e0b;
}

.pyramid-redpoint {
  background: #dc2626;
}

.pyramid-toprope {
  background: #9ca3af;
}

.pyramid-count {
  position: absolute;
  right: 0;
  left: 0;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.legend-onsight {
  background: #f59e0b;
}

.legend-redpoint {
  background: #dc2626;
}

.legend-toprope {
  background: #9ca3af;
}
</style>
