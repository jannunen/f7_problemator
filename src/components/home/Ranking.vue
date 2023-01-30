<template>

    <f7-sheet style="height : 500px;" v-model:opened="showRankingSheet" close-by-backdrop-click>
        <f7-toolbar>
            <div class="left"></div>
            <div class="center">Rules for ranking game</div>
            <div class="right">
                <f7-link sheet-close>Close</f7-link>
            </div>
        </f7-toolbar>
        <f7-page-content>
            <f7-block inset>
                All ascents earn points. 6a = 400, 6a+ = 450, 7a = 700, 7c = 900, 8a = 1000.
                <br />
                <div class="p-1 bg-blue-900 mx-2">
                <table class="w-full my-1">
                <tr><th class="bg-blue-700 " colspan="100">
                <strong>Boulder:</strong>
                </th></tr>
                <tr><td>Flash (= 1st try)</td><td>+93</td></tr>
                <tr><td>2nd go </td><td>+20</td></tr>
                <tr><td>3rd-10th</td><td>+3</td></tr>
                <tr><td>more than 10</td><td>-1</td></tr>

                <tr><th class="bg-blue-700 " colspan="100">
                <strong>Sport:</strong>
                </th></tr>
                <tr><td>Onsight (no prior knowledge)</td><td>+143</td></tr>
                <tr><td>Flash </td><td>+53</td></tr>
                <tr><td>2nd go</td><td>+11</td></tr>
                <tr><td>3rd-10th</td><td>+3</td></tr>
                <tr><td>more than 10</td><td>-1</td></tr>
                </table>
                </div>

            </f7-block>
        </f7-page-content>
    </f7-sheet>
    <div class="mt-8 m-4 rounded-md raised shadow-lg p-4 border border-gray-800">
        <div class="font-bold text-lg flex " style="color: #3bb273">{{ t('ranking.ranking_title') }} <div class="pl-2"><a class=" text-blue-500" @click.prevent="refresh">refresh ranking</a></div></div>
        <p>
            Ranking is based on top10 hardest problems. Flashes give more points, tries deduce.
            <f7-icon @click.prevent="showRankingSheet = true" material="info"></f7-icon>
            <span class="text-blue-300 font-bold">If you don't see your ranking in your country's list, go to the settings page, check set the country and climb some problems.</span>
            <span class="my-1 text-blue-300 font-bold">By clicking the line, </span>
        </p>
        <div class="flex gap-2 mt-2">
            Show Ranking:
            <a @click.prevent="changeTarget(gym.country)" :class="{ 'bg-green-600 text-sm rounded-full px-2 text-green-100': (rankingTarget == gym.country) }">{{ gym.country }}</a>
            |
            <a @click.prevent="changeTarget('global')" :class="{ 'bg-green-600 text-sm rounded-full px-2 text-green-100': (rankingTarget == 'global') }">Global</a>
        </div>
        <div v-if="rankings != null">
            <div class="flex flex-row justify-around  py-3 px-2 mt-2 bg-gray-700" >
                <a :class="{'underline text-white-600 font-bold' : (rankingTab==idx)}" @click.prevent="rankingTab=idx" v-for="(r, idx) in rankings" :key="r.ranking.id" :tab-link="`#r_` + r.ranking.id" >{{ r.ranking.name }}</a>
            </div>
            
            <div v-for="(r, idx) in rankings" :key="r.ranking.id">
                <div v-if="rankingTab==idx" :id="`r_` + r.ranking.id" class="pt-0 mt-0" :tab-active="rankingTab==idx">
                    <show-ranking :country="rankingTarget" :ranking="r" />
                </div>
            </div>
            

        </div>
        <div v-else>
            Loading...
        </div>
    </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { watch, ref, computed } from 'vue'
import PButton from '@components/PButton.vue'
import ShowRanking from '@components/home/ShowRanking.vue'
const { t } = useI18n()
const rankingTab = ref(0)
const store = useStore()
const rankingTarget = ref(null)
const showRankingSheet = ref(false)
const rankings = computed(() => store.state.rankings)
const gym = computed(() => store.state.gym)
const changeTarget = (tgt) => {
    rankingTarget.value =tgt
    refresh()
}

rankingTarget.value = gym.value.country
const refresh = () => {
    store.dispatch('rankings', { country: rankingTarget.value })
}
refresh()
</script>