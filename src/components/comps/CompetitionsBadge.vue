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
    import store from '@js/store.js'
    import { f7ready, f7, useStore } from 'framework7-vue'
    import { onMounted, computed, ref } from 'vue'
    import dayjs from 'dayjs'
    const { t } = useI18n()
    store.dispatch('getUpcomingCompetitions')
    const comps = useStore('upcomingcompetitions')
    const upcomingCount = computed(() => comps.value.upcoming.length)
    const ongoingCount = computed(() => comps.value.ongoing.length)


</script>