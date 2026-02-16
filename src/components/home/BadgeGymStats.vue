<template>
    <div v-if="gym != null" class="p-card">
    <div class="p-card__title">Problem/Route completion status</div>
    <div class="grid grid-cols-2 gap-4 my-3">
      <div class="p-stat">
        <div class="p-stat__value">{{ percentageBoulders }}<span class="p-stat__unit">%</span></div>
        <div class="p-stat__label">of {{ totalBoulders }} Boulders</div>
      </div>
      <div class="p-stat">
        <div class="p-stat__value">{{ percentageRoutes }}<span class="p-stat__unit">%</span></div>
        <div class="p-stat__label">of {{ totalRoutes }} Routes</div>
      </div>
    </div>
    <div class="text-center mt-2">
      <a @click="f7.views.main.router.navigate('/gym/completion')" class="p-link text-sm font-semibold uppercase cursor-pointer">Open more details</a>
    </div>
    </div>
</template>
<script setup>
import { f7  } from 'framework7-vue'
import { ref, computed } from 'vue'
import store from '@js/store.js'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
    gym: Object,
})
const problems = computed(() => store.state.gym.problems)
const ticks = computed(() => store.state.alltime.ticks)

const percentageRoutes = ref(0)
const totalRoutes = ref(0)
const tickedAmountRoutes = ref(0)

const percentageBoulders = ref(0)
const totalBoulders = ref(0)
const tickedAmountBoulders = ref(0)

const amounts = problems.value.reduce((acc, item) => {
    if (item.routetype == 'boulder') {
        acc.totalBoulders = acc.totalBoulders + 1
    } else if (item.routetype == 'sport') {
        acc.totalRoutes = acc.totalRoutes + 1
    }
    return acc
}, { totalRoutes: 0, totalBoulders: 0 })

totalRoutes.value = amounts.totalRoutes
totalBoulders.value = amounts.totalBoulders

const problemsids = ticks.value.map((tick) => tick.problemid)

// Calulate ticked problems/routes amounts
const distinctProblems = [...new Set(problemsids)]

const ret = distinctProblems.reduce((acc, pid) => {
    const problem = problems.value.find(item => item.id == pid)
    if (problem != null) {
        if (problem.routetype == 'boulder') {
            acc.boulders = acc.boulders + 1
        } else if (problem.routetype == 'sport') {
            acc.routes = acc.routes + 1
        }
        acc.total = acc.total + 1
    }
    return acc
}, { routes: 0, boulders: 0, total: 0 })
tickedAmountBoulders.value = ret.boulders
tickedAmountRoutes.value = ret.routes

if (totalRoutes.value > 0) {
    percentageRoutes.value = Math.round((tickedAmountRoutes.value / totalRoutes.value) * 1000) / 10
}

if (totalBoulders.value > 0) {
    percentageBoulders.value = Math.round((tickedAmountBoulders.value / totalBoulders.value) * 1000) / 10
}

</script>
