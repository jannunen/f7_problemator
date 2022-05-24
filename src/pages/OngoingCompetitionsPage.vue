<template>
  <f7-page>
    <f7-navbar >
       <f7-nav-left><f7-link href="/">&lt; home</f7-link></f7-nav-left>
       <f7-nav-title> {{ t('comps.ongoing_competitions') }} </f7-nav-title>
       </f7-navbar>
    <f7-block>
      <f7-list media-list>
        <f7-list-item
          v-for="comp in comps.ongoing"
          :key="comp.id"
          link="#"
          :title="comp.name"
          :after="comp.compdate"
        >
        <template #text>
          <div v-html=" getCompText(comp) "></div>
        </template>
        <template #subtitle>
          {{ comp.location }}
          <span v-if="comp.participates"></span>
          <span v-else class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</span>
        </template>
        </f7-list-item>
      </f7-list>

    </f7-block>
  </f7-page>
</template>
<script setup>
    import { useI18n } from 'vue-i18n'
    import store from '@js/store.js'
    import { f7, useStore } from 'framework7-vue'
    import { computed, ref } from 'vue'
    import dayjs from 'dayjs'
    import relativeTime from "dayjs/plugin/relativeTime";
    dayjs.extend(relativeTime)
    const { t } = useI18n()
    const getCompText = (comp) => {
        const left = dayjs().to(comp.timespan_end)
        return `${t('comps.ongoing_between')} ${comp.timespan_start} - ${comp.timespan_end}<br />${t('comps.comp_time_ends_in')} ${left}`
    }
    const comps = useStore('upcomingcompetitions')
    if (comps.value.loaded === false) {
        store.dispatch('getUpcomingCompetitions')
    }

</script>