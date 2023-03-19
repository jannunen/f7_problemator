<template>
  <div class="mt-8 m-4 rounded-md raised shadow-lg border border-gray-800">
    <div class="py-2 px-4 font-bold text-lg" style="color: #3bb273">{{ t('comps.competitions') }}</div>
    <f7-list class="m-0">
        <f7-list-item badge-color="red" link="/competitions/upcoming" :title="t('comps.upcoming_competitions')" :badge="upcomingCount"> </f7-list-item>
        <f7-list-item badge-color="blue" link="/competitions/past" :title="t('comps.past_competitions')" :badge="pastCount"> </f7-list-item>
    </f7-list>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import {  computed, ref } from 'vue'
const store = useStore()

const { t } = useI18n()
const comps = computed(() => store.state.upcomingcomps)
if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
const upcomingCount = computed(() => comps.value.upcoming.length)
const pastCount = computed(() => comps.value.past.length)


</script>