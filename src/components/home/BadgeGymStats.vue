<template>
    <div v-if="gym != null" class="p-card">
    <div class="p-card__title">{{ t('gym_stats.title') }}</div>
    <div class="grid grid-cols-2 gap-4 my-3">
      <div class="p-stat">
        <div class="p-stat__value">{{ percentageBoulders }}<span class="p-stat__unit">%</span></div>
        <!-- The count as well as the share: "3%" does not tell you whether
             three more sends would move it, and the number climbed is the
             thing a climber is actually keeping track of. -->
        <div class="p-stat__count num">{{ tickedAmountBoulders }} / {{ totalBoulders }}</div>
        <div class="p-stat__label">{{ t('gym_stats.boulders') }}</div>
      </div>
      <div class="p-stat">
        <div class="p-stat__value">{{ percentageRoutes }}<span class="p-stat__unit">%</span></div>
        <div class="p-stat__count num">{{ tickedAmountRoutes }} / {{ totalRoutes }}</div>
        <div class="p-stat__label">{{ t('gym_stats.routes') }}</div>
      </div>
    </div>
    <div class="text-center mt-2">
      <a @click="f7.views.main.router.navigate('/gym/completion')" class="p-link text-sm font-semibold uppercase cursor-pointer">{{ t('gym_stats.open_details') }}</a>
    </div>
    </div>
</template>
<script setup>
import { f7  } from 'framework7-vue'
import { computed } from 'vue'
import store from '@js/store.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
    gym: Object,
})
const problems = computed(() => store.state.gym.problems ?? [])
const ticks = computed(() => store.state.alltime.ticks ?? [])

// Computed rather than calculated once in setup. This card used to read its
// numbers at mount and never again, so ticking a boulder left the percentage
// showing what it was when the screen was built.
const totals = computed(() =>
    problems.value.reduce((acc, item) => {
        if (item.routetype == 'boulder') acc.boulders += 1
        else if (item.routetype == 'sport') acc.routes += 1
        return acc
    }, { routes: 0, boulders: 0 })
)

const ticked = computed(() => {
    // Distinct: a problem climbed three times is still one problem climbed.
    const seen = new Set(ticks.value.map((tick) => tick.problemid))
    const byId = new Map(problems.value.map((p) => [String(p.id), p]))
    return [...seen].reduce((acc, pid) => {
        const problem = byId.get(String(pid))
        if (!problem) return acc
        if (problem.routetype == 'boulder') acc.boulders += 1
        else if (problem.routetype == 'sport') acc.routes += 1
        return acc
    }, { routes: 0, boulders: 0 })
})

const totalBoulders = computed(() => totals.value.boulders)
const totalRoutes = computed(() => totals.value.routes)
const tickedAmountBoulders = computed(() => ticked.value.boulders)
const tickedAmountRoutes = computed(() => ticked.value.routes)

const share = (done, total) => (total > 0 ? Math.round((done / total) * 1000) / 10 : 0)
const percentageBoulders = computed(() => share(tickedAmountBoulders.value, totalBoulders.value))
const percentageRoutes = computed(() => share(tickedAmountRoutes.value, totalRoutes.value))

</script>

<style scoped>
/* Between the percentage and its label: smaller than the headline number,
   brighter than the label, because it is the detail you check second. */
.p-stat__count {
  margin-top: 2px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-secondary);
}
</style>

