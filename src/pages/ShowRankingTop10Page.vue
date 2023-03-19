<template>
  <f7-page >
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.past_competitions') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
    <show-climber-top10 :country="props.country" :first="first" :last="last" :climber_id="climber" :ranking_id="props.ranking.ranking.id" :opened="showAscents" @close="showAscents = false"/>
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import ShowClimberTop10 from '@components/ranking/ShowClimberTop10.vue'
const store = useStore()
const { t } = useI18n()
dayjs.extend(relativeTime)


</script>
