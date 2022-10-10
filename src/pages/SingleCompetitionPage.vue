<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.competition_title') }} </f7-nav-title>
    </f7-navbar>
    <f7-block  v-if="comp != null">
      <div v-if="isJudge">
        <f7-block-title>{{ t('comps.you_are_a_judge') }}</f7-block-title>
        <f7-link :href="getJudgingLink" class="w-full px-8 py-3 bg-blue-500 font-bold ">Open judging sheet</f7-link>
      </div>
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
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import CompetitionEntry from '@components/comps/CompetitionEntry.vue'

const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const store = useStore()
const comp = computed(() => store.state.competition)
const climber = computed(() => store.state.climber)

const getJudgingLink = computed(() => {
    if (comp.value != null) {
        const url = `/competitions/${comp.value.id}/judging`
        return url
    }
})
const isJudge = computed(() => {
  return comp.value.judges.find(x => {
    return x.id == climber.value.id
   }) 
})
onMounted(() => {
  store.dispatch('getCompetition',props.compid)
})
</script>
