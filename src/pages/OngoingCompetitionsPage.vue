<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">&lt; home</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.ongoing_competitions') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
      <f7-list media-list>
        <f7-list-item v-if="comps.ongoing.length == 0">
         {{ t('comps.No ongoing competitions currently') }}
        </f7-list-item>
        <f7-list-item
          v-for="comp in comps.ongoing"
          :key="comp.id"
          :link="getLink(comp)"
          :title="comp.name"
        >
          <template #after>
          {{ toLocalTime(comp.compdate) }}
          </template>
          <template #text>
            <div v-html="getCompText(comp)"></div>
          </template>
          <template #subtitle>
            {{ comp.location }} 

            <span class="text-green-500" v-if="comp.isjudge">{{ t('comps.you_are_a_judge') }}</span>

            
            <span v-if="isRegistrationPossible(comp, nowUTC.value)">
              <span class="text-green-500 font-bold" v-if="isPaidAndRegistered(comp)">{{ t('comps.you_are_registered') }}</span>
              <span v-else>
                  <div class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</div>
                  <span v-if="isFull(comp)" class="text-red-700 font-bold">{{ t('comps.full') }}</span>
                  <span v-if="isRegistrationPossible(comp, nowUTC.value)">
                      <div>{{ t('Registration between') }} {{ toLocalTime(comp.registration_start) }} - {{ toLocalTime(comp.registration_end) }}</div>
                  </span>
                  <div v-else>Registration is between {{ toLocalTime(comp.registration_start)}} -  {{ toLocalTime(comp.registration_end)}}</div>
              </span>
            </span>
            <div v-else class="text-red-500">
              {{ t('Not registered and the registration time is closed.') }}
            </div>

          </template>
        </f7-list-item>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { computed, ref} from 'vue'
import dayjs from 'dayjs'
import { isRegistrationPossible, toLocalTime } from '@helpers/component.helpers'
import relativeTime from 'dayjs/plugin/relativeTime'
const store = useStore()
const climber = computed(() => store.state.climber)
const nowUTC = ref(dayjs().utc())
setInterval(() => nowUTC.value = dayjs().utc(),1000*30)
dayjs.extend(relativeTime)
const { t } = useI18n()
const isPaidAndRegistered = (comp) => {
  if (climber.value == null) {
    return false
  }
  const found = comp.paidregistrations.find(x => {
    return x.id == climber.value.id
  })
  return found
}

const isFull = (comp) => (comp.maxcontenders != 0 && comp.paidregistrations_count >= comp.maxcontenders)
const getCompText = (comp) => {
  const left = dayjs().to(comp.timespan_end)
  return `<span class="text-white">${t('comps.ongoing_between')} ${dayjs(comp.timespan_start).format("YYYY-MM-DD HH:mm")} - ${
    dayjs(comp.timespan_end).format("YYYY-MM-DD HH:mm")
  }</span><br />${t('comps.comp_time_ends_in')} ${left}`
}
const getLink = (comp) => {
    // The actual link will be used, if registration IS possible and comp IS NOT full
    if (comp.isjudge || (!isFull(comp) || isPaidAndRegistered(comp) )) {
      return `/competitions/` + comp.id
    } else {
      return null
    }
}
const comps = computed(() => store.state.upcomingcomps)

if (comps.value.loaded === false) {
  store.dispatch('getUpcomingCompetitions')
}
</script>
