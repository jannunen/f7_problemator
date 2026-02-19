<template>

    <f7-sheet style="height : 500px;" v-model:opened="showRankingSheet" close-by-backdrop-click>
        <f7-toolbar>
            <div class="left"></div>
            <div class="center">{{ t('ranking.rules_title') }}</div>
            <div class="right">
                <f7-link sheet-close>{{ t('global.close_action') }}</f7-link>
            </div>
        </f7-toolbar>
        <f7-page-content>
            <div class="p-4">
                {{ t('ranking.rules_intro') }}
                <br />
                <div class="p-card mt-3">
                    <table class="w-full text-sm">
                        <tbody>
                            <tr>
                                <th class="text-left py-1 p-text-accent" colspan="100">
                                    <strong>{{ t('ranking.boulder_label') }}</strong>
                                </th>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.flash_1st') }}</td>
                                <td class="text-right font-semibold p-text-accent">+93</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.2nd_go') }}</td>
                                <td class="text-right font-semibold p-text-accent">+20</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.3rd_10th') }}</td>
                                <td class="text-right font-semibold p-text-accent">+3</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.more_than_10') }}</td>
                                <td class="text-right font-semibold p-text-danger">-1</td>
                            </tr>

                            <tr>
                                <th class="text-left py-1 pt-3 p-text-accent" colspan="100">
                                    <strong>{{ t('ranking.sport_label') }}</strong>
                                </th>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.onsight_no_prior') }}</td>
                                <td class="text-right font-semibold p-text-accent">+143</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>Flash</td>
                                <td class="text-right font-semibold p-text-accent">+53</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.2nd_go') }}</td>
                                <td class="text-right font-semibold p-text-accent">+11</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.3rd_10th') }}</td>
                                <td class="text-right font-semibold p-text-accent">+3</td>
                            </tr>
                            <tr class="ranking-rule-row">
                                <td>{{ t('ranking.more_than_10') }}</td>
                                <td class="text-right font-semibold p-text-danger">-1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </f7-page-content>
    </f7-sheet>

    <div class="p-card">
        <div class="flex items-center justify-between mb-2">
            <div class="p-card__title mb-0">{{ t('ranking.ranking_title') }}</div>
            <a class="p-link text-sm" @click.prevent="refresh">{{ t('ranking.refresh') }}</a>
        </div>
        <p class="text-sm mb-2 p-text-muted leading-normal">
            {{ t('ranking.description') }}
            <span class="material-icons p-link ranking-info-icon" @click.prevent="showRankingSheet = true">info</span>
        </p>
        <p class="text-xs mb-3 p-text-accent leading-snug">
            {{ t('ranking.country_hint') }}
        </p>

        <!-- Country / Global toggle -->
        <div class="p-toggle-group mb-3">
            <button
                    class="p-toggle-group__btn"
                    :class="{ 'p-toggle-group__btn--active': rankingTarget == gym.country }"
                    @click.prevent="changeTarget(gym.country)">{{ gym.country }}</button>
            <button
                    class="p-toggle-group__btn"
                    :class="{ 'p-toggle-group__btn--active': rankingTarget == 'global' }"
                    @click.prevent="changeTarget('global')">{{ t('ranking.global') }}</button>
        </div>

        <div v-if="rankings != null">
            <!-- Route type toggle -->
            <div class="p-toggle-group mb-3">
                <button
                        class="p-toggle-group__btn"
                        :class="{ 'p-toggle-group__btn--active': routeTypeFilter == 'all' }"
                        @click.prevent="routeTypeFilter = 'all'">{{ t('ranking.all_tab') }}</button>
                <button
                        class="p-toggle-group__btn"
                        :class="{ 'p-toggle-group__btn--active': routeTypeFilter == 'boulder' }"
                        @click.prevent="routeTypeFilter = 'boulder'">{{ t('ranking.boulder_tab') }}</button>
                <button
                        class="p-toggle-group__btn"
                        :class="{ 'p-toggle-group__btn--active': routeTypeFilter == 'sport' }"
                        @click.prevent="routeTypeFilter = 'sport'">{{ t('ranking.sport_tab') }}</button>
            </div>

            <!-- Ranking tabs -->
            <div class="ranking-tabs-scroll mb-3">
                <div class="p-toggle-group">
                    <button
                            v-for="(r, idx) in filteredRankings"
                            :key="r.ranking.id"
                            class="p-toggle-group__btn"
                            :class="{ 'p-toggle-group__btn--active': rankingTab == idx }"
                            @click.prevent="rankingTab = idx">{{ r.ranking.name }}</button>
                </div>
                <span class="scroll-hint material-icons">chevron_right</span>
            </div>

            <div v-for="(r, idx) in filteredRankings" :key="r.ranking.id">
                <div v-if="rankingTab == idx">
                    <show-ranking :country="rankingTarget" :ranking="r" />
                </div>
            </div>

        </div>
        <div v-else class="text-center py-4">
            <div class="p-spinner"></div>
            <div class="text-sm mt-2 p-text-muted">{{ t('global.loading') }}</div>
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
const routeTypeFilter = ref('all')
const showRankingSheet = ref(false)
const rankings = computed(() => store.state.rankings)
const gym = computed(() => store.state.gym)
const filteredRankings = computed(() => {
    if (!rankings.value) return null
    return rankings.value.filter(r => r.ranking.route_type === routeTypeFilter.value)
})
watch(routeTypeFilter, (newVal, oldVal) => {
    // Preserve the selected timespan when switching route type
    const oldList = rankings.value?.filter(r => r.ranking.route_type === oldVal) || []
    const selectedName = oldList[rankingTab.value]?.ranking?.name
    if (selectedName) {
        const newList = rankings.value?.filter(r => r.ranking.route_type === newVal) || []
        const matchIdx = newList.findIndex(r => r.ranking.name === selectedName)
        rankingTab.value = matchIdx >= 0 ? matchIdx : 0
    } else {
        rankingTab.value = 0
    }
})
const changeTarget = (tgt) => {
    rankingTarget.value = tgt
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

.ranking-tabs-scroll {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}

.ranking-tabs-scroll::-webkit-scrollbar {
    display: none;
}

.ranking-tabs-scroll .p-toggle-group {
    flex-wrap: nowrap;
    white-space: nowrap;
    padding-right: 24px;
}

.scroll-hint {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--p-text-muted, #999);
    pointer-events: none;
}
</style>
