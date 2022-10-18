<template>
  <f7-page >
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.upcoming_competitions') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <f7-list media-list>
        <f7-list-item
          v-for="comp in comps.upcoming"
          :key="comp.id"
          :link="getLink(comp)"
          :title="comp.name"
          :after="comp.location"
        >
        <template #text>
          <div v-html="getCompText(comp)"></div>
        </template>
        <template #subtitle>
          @{{ comp.compdate }}
          <span v-if="comp.participates" class="font-bold text-green-500">{{ t('comps.you_are_registered') }}</span>
          <span v-else-if="comp.participatesunpaid" class="font-bold text-red-500">{{ t('comps.you_are_registered_not_paid') }}</span>
          <span v-else>
               <div v-if="isFull(comp)" class="flex flex-row">
               <div class="pe-2 text-red-700 font-bold">{{ t('comps.full') }}</div>
               </div>
               <span v-else-if="isRegistrationPossible(comp)" class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</span>
        </span>
        </template>
        
        </f7-list-item>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { toLocalTime } from '../js/helpers/component.helpers'
const store = useStore()
const { t } = useI18n()
const isFull = (comp) => (comp.maxcontenders != 0 && comp.paidregistrations_count >= comp.maxcontenders)
const isRegistrationPossible = (comp) => {
  if (comp.registration_start == null) {
    return dayjs().isBefore(dayjs(comp.registration_end)) 
  } else {
    return dayjs().isAfter(comp.registration_start) && dayjs().isBefore(dayjs(comp.registration_end)) 
  }
}
dayjs.extend(relativeTime)

const getCompText = (comp) => {
    if (!isFull(comp) && isRegistrationPossible(comp)) {
        return `
        ${t('Registration between')}: ${comp.registration_start || 'now'} - ${comp.registration_end}`
        + ", " + t('ending in') +" "+ dayjs(comp.registration_end).fromNow()
    } else {
      if (!isFull(comp)) {
        return `Registration time was/is ${toLocalTime(comp.registration_start)} - ${toLocalTime(comp.registration_end)}`
      }
    }
}
const getLink = (comp) => {
    if (!isFull(comp) && isRegistrationPossible(comp)) {
        return `/competitions/`+comp.id
    } else {
        return null
    } 
}
const comps = computed(() => store.state.upcomingcomps)

if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
</script>
