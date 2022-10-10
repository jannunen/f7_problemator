<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link href="/">&lt; home</f7-link></f7-nav-left>
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
          :after="comp.compdate"
        >
          <template #text>
            <div v-html="getCompText(comp)"></div>
          </template>
          <template #subtitle>
            {{ comp.location }} <span v-if="comp.participates">{{ t('comps.you_are_registered') }}</span>
            <span class="text-green-500" v-if="comp.isjudge">{{ t('comps.you_are_a_judge') }}</span>
            <span v-else>
                <div class="text-orange-400 font-bold">{{ t('comps.not_registered') }}</div>
                <span v-if="isRegistrationPossible(comp)">
                    <div>{{ t('comps.comp_registration_ends') }} {{ comp.registration_end }}</div>
                </span>
                <div v-else>{{ t('comp.registration_has_ended') }}</div>
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
import { computed} from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
const store = useStore()
dayjs.extend(relativeTime)
const { t } = useI18n()
const isRegistrationPossible = (comp) => dayjs().isBefore(dayjs(comp.registration_end)) 
const getCompText = (comp) => {
  const left = dayjs().to(comp.timespan_end)
  return `${t('comps.ongoing_between')} ${comp.timespan_start} - ${
    comp.timespan_end
  }<br />${t('comps.comp_time_ends_in')} ${left}`
}
const getLink = (comp) => {
  if (comp.isjudge || isRegistrationPossible(comp)) {
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
