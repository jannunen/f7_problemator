<template>
  <f7-page >
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.past_competitions') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <f7-list media-list>
        <f7-list-item
          :external="true"
          target="_comp_results"
          v-for="comp in past"
          :key="comp.id"
          :link="getLink(comp)"
          :title="comp.name"
        >
        <template #after>
        {{ comp.location}}
        </template>
        <template #text>
          {{ comp.tyyppi }}
        </template>
        <template #subtitle>
          {{ toLocalTime(comp.compdate) }}
        </template>
        
        </f7-list-item>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed } from 'vue'
import dayjs from 'dayjs'
import { toLocalTime } from '../js/helpers/component.helpers'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'
const { t } = useI18n()
dayjs.extend(relativeTime)

const getLink = (comp) => {
  return `https://api3.problemator.fi/comps/` + comp.id+ '/results'
}
const { data: comps } = useQuery({
  queryKey: ['upcomingCompetitions'],
  queryFn: () => api.getUpcomingCompetitions(),
  initialData: { upcoming: [], ongoing: [], past: [] },
})
const past = computed(() => comps.value?.past || [])

</script>
