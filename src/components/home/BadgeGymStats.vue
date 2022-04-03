<template>
    <div v-if="gym != null" class="p-2 border border-gray-700 text-center">
        <h1 class="text-3xl text-sea-300 my-2">{{ gym.name }}</h1>
        Boulders
        <hr class="mx-auto w-2/5" />
        <p class="w-3/5 flex mx-auto flex-row justify-between gap-2 text-xl"><span class="text-2xl">{{ percentageBoulders }}%</span> of <span class="text-2xl">{{ totalBoulders }}</span></p>
        Routes
        <hr class="mx-auto w-2/5 "  />
        <p class="w-3/5 flex mx-auto flex-row justify-between gap-2 text-xl"><span class="text-2xl">{{ percentageRoutes }}%</span> of <span class="text-2xl">{{ totalRoutes }}</span></p>
    </div>
</template>
<script setup>
import { ref ,computed} from 'vue'
import store from '@js/store.js'
import { f7,  useStore } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const props = defineProps({
    gym : Object,
})
const profile = useStore('profile')
const problems = computed(() => store.state.gym.problems)

const percentageRoutes = ref(0)
const totalRoutes = ref(0)
const tickedAmountRoutes = ref(0)

const percentageBoulders = ref(0)
const totalBoulders = ref(0)
const tickedAmountBoulders = ref(0)

const amounts = problems.value.reduce((acc, item) => {
    if (item.routetype =='boulder') {
        acc.totalBoulders = acc.totalBoulders + 1
    } else if (item.routetype =='sport') {
        acc.totalRoutes = acc.totalRoutes + 1
    }
    return acc
},{totalRoutes : 0, totalBoulders : 0})

totalRoutes.value = amounts.totalRoutes
totalBoulders.value = amounts.totalBoulders

if (profile.value.info != null) {
    // Count only unique ticks
    const problemsids = profile.value.info.ticked.map((tick) => tick.problemid);

    // Calulate ticked problems/routes amounts
    const distinctProblems = [...new Set(problemsids)];

    const ret  = distinctProblems.reduce((acc,pid) => {
        const problem = problems.value.find(item => item.id==pid)
        if (problem != null) {
            if (problem.routetype == 'boulder') {
                acc.routes = acc.routes + 1
            } else if (problem.routetype == 'sport') {
                acc.problems = acc.problems + 1
            }
            acc.total = acc.total + 1
        }
        return acc

    },{routes : 0, boulders : 0, total : 0})
    tickedAmountBoulders.value = ret.boulders
    tickedAmountRoutes.value = ret.routes
}
if (totalRoutes.value > 0) {
    percentageRoutes.value = Math.round((tickedAmountRoutes.value / totalRoutes.value) * 1000) / 10;
}
if (totalBoulders.value > 0) {
    percentageBoulders.value = Math.round((tickedAmountBoulders.value / totalBoulders.value) * 1000) / 10;
}

</script>