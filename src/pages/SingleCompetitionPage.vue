<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.competition_title') }} </f7-nav-title>
    </f7-navbar>
    <f7-block  v-if="comp != null">
      <div v-if="!comp.participates">
          <competition-register-info :comp="comp" />
      </div>
      <div v-else>
          <competition-entry :comp="comp" />
      </div>

      
    </f7-block>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { f7ready, f7, useStore } from 'framework7-vue'
import { onMounted, computed, ref } from 'vue'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import CompetitionEntry from '@components/comps/CompetitionEntry.vue'
import dayjs from 'dayjs'
const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const comp = useStore('competition')
 onMounted(() => {
    store.dispatch('getCompetition',props.compid)
})
</script>
