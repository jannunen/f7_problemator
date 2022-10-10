<template>
  <div class="mt-8 m-4 rounded-md raised shadow-lg border border-gray-800">
    <div class="py-2 px-4 font-bold text-lg" style="color: #3bb273">{{ t('comps.competitions') }}</div>
    <f7-list>
        <!--
        <f7-list-item badge-color="lightblue" @click.prevent="f7.views.main.router.navigate('/competitions/upcoming')" link="/competitions/upcoming" :title="t('comps.upcoming_competitions')" :badge="upcomingCount"> </f7-list-item>
        <f7-list-item badge-color="orange"    @click.prevent="f7.views.main.router.navigate('/competitions/ongoing')" link="/competitions/ongoing" :title="t('comps.ongoing_competitions')" :badge="ongoingCount"> </f7-list-item>
        -->
        <f7-list-item badge-color="lightblue" link="/competitions/upcoming" :title="t('comps.upcoming_competitions')" :badge="upcomingCount"> </f7-list-item>
        <f7-list-item badge-color="orange"    link="/competitions/ongoing" :title="t('comps.ongoing_competitions')" :badge="ongoingCount"> </f7-list-item>
    </f7-list>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { onMounted, computed, ref } from 'vue'
const store = useStore()

const { t } = useI18n()
const comps = computed(() => store.state.upcomingcomps)
if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
const upcomingCount = computed(() => comps.value.upcoming.length)
const ongoingCount = computed(() => comps.value.ongoing.length)


</script>