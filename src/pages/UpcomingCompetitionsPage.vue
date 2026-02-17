<template>
  <f7-page >
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.upcoming_competitions') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <f7-list media-list>
        <f7-list-item
          v-for="comp in comps.upcoming"
          :key="comp.id"
          :link="getLink(comp)"
          :title="comp.name"
          :after="comp.id"
        >
        <template #text>
          <div v-html="getCompText(comp)"></div>
        </template>
        <template #subtitle>
          <span>@{{ toLocalTime(comp.compdate) }}</span>
          <div >{{ comp.location }}</div>
          <span v-if="comp.participates" class="font-bold text-green-500">{{ t('comps.you_are_registered') }}</span>
          <span v-else-if="comp.participatesunpaid" class="font-bold text-red-500">{{ t('comps.you_are_registered_not_paid') }}</span>
          <span v-else>
               <div v-if="isFull(comp)" class="flex flex-row">
               <div class="pe-2 text-red-700 font-bold">{{ t('comps.full') }}</div>
               </div>
               <span v-else-if="isRegistrationPossible(comp, nowUTC.value)" class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</span>
        </span>
        </template>
        
        </f7-list-item>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import relativeTime from 'dayjs/plugin/relativeTime'
import { ref } from 'vue'
import dayjs from 'dayjs'
import { isRegistrationPossible, toLocalTime } from '../js/helpers/component.helpers'
import { useQuery } from '@tanstack/vue-query'
import api from '@js/api'
const { t } = useI18n()
const isFull = (comp) => (comp.maxcontenders != 0 && comp.paidregistrations_count >= comp.maxcontenders)
const nowUTC = ref(dayjs().utc())
setInterval(() => nowUTC.value = dayjs().utc(),1000*30)

dayjs.extend(relativeTime)

const getCompText = (comp) => {
    if (!isFull(comp) && isRegistrationPossible(comp, nowUTC.value)) {
        return `
        <div class="text-green-400">${t('Registration between')}: ${toLocalTime(comp.registration_start) || 'now'} - ${toLocalTime(comp.registration_end)}`
        + ", " + t('ending in') +" "+ dayjs.utc(comp.registration_end).fromNow()+ "</div>"
    } else {
      if (!isFull(comp)) {
        return `<div class="text-orange-400">Registration time was/is ${toLocalTime(comp.registration_start)} - ${toLocalTime(comp.registration_end)}</div>`
      }
    }
}
const getLink = (comp) => {
        return `/competitions/`+comp.id
}
const { data: comps } = useQuery({
  queryKey: ['upcomingCompetitions'],
  queryFn: () => api.getUpcomingCompetitions(),
  select: (data) => ({ upcoming: data.upcoming || [], ongoing: data.ongoing || [], past: data.past || [], loaded: true }),
  initialData: { upcoming: [], ongoing: [], past: [], loaded: false },
})
</script>
