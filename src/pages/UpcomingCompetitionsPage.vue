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
          :after="comp.compdate"
        >
        <template #text>
          <div v-html="getCompText(comp)"></div>
        </template>
        <template #subtitle>
          {{ comp.location }}
          <span v-if="comp.participates" class="font-bold text-green-500">{{ t('comps.you_are_registered') }}</span>
          <span v-else-if="comp.participatesunpaid" class="font-bold text-red-500">{{ t('comps.you_are_registered_not_paid') }}</span>
          <span v-else>
               <span v-if="isRegistrationPossible(comp)" class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</span>
        </span>
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
const { t } = useI18n()
const isRegistrationPossible = (comp) => dayjs().isBefore(dayjs(comp.registration_end)) 

const getCompText = (comp) => {
    if (isRegistrationPossible(comp)) {
        return `${t('comps.registration_ends')} ${comp.registration_end}`
    } else {
        return `<strong>${t('comps.registration_has_ended')}</strong>`
    }
}
const getLink = (comp) => {
    if (isRegistrationPossible(comp)) {
        return `/competitions/`+comp.id
    } else {
        return null
    }
}
const comps = useStore('upcomingcompetitions')
if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
</script>
