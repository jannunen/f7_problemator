<template>
    <div v-if="gym != null" class="mt-8 m-4 rounded-md raised shadow-lg border border-gray-800">
    <div class="py-2 px-4 font-bold text-lg" style="color: #3bb273">Problem/Route completion status</div>
    <div class="p-1 my-1 border-gray-700 text-center grid grid-cols-2">
      <div class="col-span-2">
        <h2 class="text-lg font-bold my-1 text-center uppercase"></h2>
        </div>
        <div>
            <p class="w-3/5 flex mx-auto flex-row justify-between gap-2 text-xl"><span class="text-2xl">{{ percentageBoulders }}%</span> of <span class="text-2xl">{{ totalBoulders }}</span></p>
            <div class="font-bold">Boulders</div>
        </div>
        <div>
            <p class="w-3/5 flex mx-auto flex-row justify-between gap-2 text-xl"><span class="text-2xl">{{ percentageRoutes }}%</span> of <span class="text-2xl">{{ totalRoutes }}</span></p>
            <div class="font-bold">Routes</div>
        </div>
      <div class="col-span-2">
       <f7-link @click="f7.views.main.router.navigate('/gym/completion')" class="uppercase my-1 text-blue-400 font-bold cursor-pointer text-center">Open more details</f7-link>
      </div>
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
