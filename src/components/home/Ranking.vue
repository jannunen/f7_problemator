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
            <div class="p-4">
                All ascents earn points. 6a = 400, 6a+ = 450, 7a = 700, 7c = 900, 8a = 1000.
                <br />
                <div class="p-card mt-3">
                <table class="w-full text-sm">
                <tr><th class="text-left py-1 p-text-accent" colspan="100">
                <strong>Boulder:</strong>
                </th></tr>
                <tr class="ranking-rule-row"><td>Flash (= 1st try)</td><td class="text-right font-semibold p-text-accent">+93</td></tr>
                <tr class="ranking-rule-row"><td>2nd go </td><td class="text-right font-semibold p-text-accent">+20</td></tr>
                <tr class="ranking-rule-row"><td>3rd-10th</td><td class="text-right font-semibold p-text-accent">+3</td></tr>
                <tr class="ranking-rule-row"><td>more than 10</td><td class="text-right font-semibold p-text-danger">-1</td></tr>

                <tr><th class="text-left py-1 pt-3 p-text-accent" colspan="100">
                <strong>Sport:</strong>
                </th></tr>
                <tr class="ranking-rule-row"><td>Onsight (no prior knowledge)</td><td class="text-right font-semibold p-text-accent">+143</td></tr>
                <tr class="ranking-rule-row"><td>Flash </td><td class="text-right font-semibold p-text-accent">+53</td></tr>
                <tr class="ranking-rule-row"><td>2nd go</td><td class="text-right font-semibold p-text-accent">+11</td></tr>
                <tr class="ranking-rule-row"><td>3rd-10th</td><td class="text-right font-semibold p-text-accent">+3</td></tr>
                <tr class="ranking-rule-row"><td>more than 10</td><td class="text-right font-semibold p-text-danger">-1</td></tr>
                </table>
                </div>
            </div>
        </f7-page-content>
    </f7-sheet>

    <div class="p-card">
        <div class="flex items-center justify-between mb-2">
            <div class="p-card__title mb-0">{{ t('ranking.ranking_title') }}</div>
            <a class="p-link text-sm" @click.prevent="refresh">refresh</a>
        </div>
        <p class="text-sm mb-2 p-text-muted leading-normal">
            Ranking is based on top10 hardest problems. Flashes give more points, tries deduce.
            <span class="material-icons p-link ranking-info-icon" @click.prevent="showRankingSheet = true">info</span>
        </p>
        <p class="text-xs mb-3 p-text-accent leading-snug">
            If you don't see your ranking in your country's list, go to the settings page, set the country and climb some problems.
        </p>

        <!-- Country / Global toggle -->
        <div class="p-toggle-group mb-3">
            <button
                class="p-toggle-group__btn"
                :class="{ 'p-toggle-group__btn--active': rankingTarget == gym.country }"
                @click.prevent="changeTarget(gym.country)"
            >{{ gym.country }}</button>
            <button
                class="p-toggle-group__btn"
                :class="{ 'p-toggle-group__btn--active': rankingTarget == 'global' }"
                @click.prevent="changeTarget('global')"
            >Global</button>
        </div>

        <div v-if="rankings != null">
            <!-- Ranking tabs -->
            <div class="p-toggle-group mb-3">
                <button
                    v-for="(r, idx) in rankings"
                    :key="r.ranking.id"
                    class="p-toggle-group__btn"
                    :class="{ 'p-toggle-group__btn--active': rankingTab==idx }"
                    @click.prevent="rankingTab=idx"
                >{{ r.ranking.name }}</button>
            </div>

            <div v-for="(r, idx) in rankings" :key="r.ranking.id">
                <div v-if="rankingTab==idx">
                    <show-ranking :country="rankingTarget" :ranking="r" />
                </div>
            </div>

        </div>
        <div v-else class="text-center py-4">
            <div class="p-spinner"></div>
            <div class="text-sm mt-2 p-text-muted">Loading...</div>
        </div>
    </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { watch, ref, computed } from 'vue'
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
<style scoped>
.ranking-rule-row td {
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--p-border);
}
.ranking-info-icon {
  font-size: 16px;
  vertical-align: middle;
  cursor: pointer;
}
</style>
