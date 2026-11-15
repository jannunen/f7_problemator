<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.competition_title') }} </f7-nav-title>
    </f7-navbar>
    <f7-block  v-if="comp != null">
      <div v-if="isPaidAndRegistered">
          <competition-entry :comp="comp" />
      </div>
      <div v-else>
        <f7-block-title>{{ t('comps.cannot_open_competition') }}</f7-block-title>
        <div class="text-center">
        {{ t('comps.you_are_not_registered_or_payment_is_not_confirmed') }}
        You can contact the organizer for more information.
        <br>
        </div>
      </div>
    </f7-block>
    <f7-block v-if="loading">
      <div class="text-center mt-2">Loading competition data...</div>
    </f7-block>
      
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { computed } from 'vue'
import CompetitionEntry from '@components/comps/CompetitionEntry.vue'
import { useClimberStore } from '@js/stores/climber.store.js'

const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const climberStore = useClimberStore()
const { data: comp, isPending } = useQuery(queries.competition(() => props.compid))
const climber = computed(() => climberStore.climber)
const isPaidAndRegistered = computed(() => {
  if (climber.value == null) {
    return false
  }
  const found = comp.value.paidregistrations.find(x => x.id == climber.value.id) != null
  return found
})
const getJudgingLink = computed(() => {
    if (comp.value != null) {
        const url = `/competitions/${comp.value.id}/judging`
        return url
    }
  // No competition yet: say so, rather than returning undefined.
  return null
})
const isJudge = computed(() => {
  return comp.value.judges.find(x => {
    return x.id == climber.value.id
   })
})
const loading = computed(() => isPending.value)
</script>
