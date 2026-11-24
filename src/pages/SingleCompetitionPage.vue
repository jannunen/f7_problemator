<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.competition_title') }} </f7-nav-title>
    </f7-navbar>
    <f7-block  v-if="comp != null">
      <!-- Once, for both views below: a judge sees it whether or not they
           are also competing. -->
      <div v-if="isJudge" class="p-banner p-banner--info comp-judge" data-test="comp-judge">
        <span class="material-icons p-banner__icon" aria-hidden="true">gavel</span>
        <div class="p-banner__content">{{ t('comps.you_are_a_judge') }}</div>
        <f7-link :href="getJudgingLink" class="p-btn p-btn--sm comp-judge__link">{{ t('comps.open_judging_sheet') }}</f7-link>
      </div>
      <div v-if="!isPaidAndRegistered">
          <competition-register-info :comp="comp" />
      </div>
      <div v-else>
          <competition-entry :comp="comp" />
      </div>
    </f7-block>
    <f7-block v-else-if="isError">
      <div class="p-banner p-banner--error comp-error" role="alert" data-test="comp-error">
        <span class="material-icons p-banner__icon" aria-hidden="true">error_outline</span>
        <div class="p-banner__content">{{ t('comps.comp_load_failed') }}</div>
        <button type="button" class="p-btn p-btn--ghost p-btn--sm" @click="refetch()">{{ t('global.retry') }}</button>
      </div>
    </f7-block>
    <f7-block v-else-if="loading">
      <div class="comp-loading" aria-busy="true" data-test="comp-loading">
        <span class="sr-only">{{ t('global.loading') }}</span>
        <div class="p-skeleton comp-loading__title"></div>
        <div class="p-skeleton p-skeleton--text"></div>
        <div class="p-skeleton p-skeleton--text-sm"></div>
        <div class="p-skeleton comp-loading__list"></div>
      </div>
    </f7-block>

  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { computed } from 'vue'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import CompetitionEntry from '@components/comps/CompetitionEntry.vue'
import { useClimberStore } from '@js/stores/climber.store.js'

const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const climberStore = useClimberStore()
const { data: comp, isPending, isError, refetch } = useQuery(queries.competition(() => props.compid))
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
  if (comp.value.judges == null || climber.value == null) {
    return false
  }
  return comp.value.judges.some(x => x.id == climber.value.id)
})

const loading = computed(() => isPending.value)
</script>

<style scoped>
.comp-judge {
  align-items: center;
  flex-wrap: wrap;
  max-width: 44rem;
  margin: 0 auto 1rem;
}
/* The button drops under the sentence rather than squeezing it into a
   column of single words. */
.comp-judge .p-banner__content {
  flex: 1 1 9rem;
}
.comp-judge .p-banner__icon {
  margin-top: 0;
  font-size: 1.125rem;
}
/* Framework7 draws a link as inline text; here it is the banner's button. */
.comp-judge__link {
  flex-shrink: 0;
  min-height: 2.5rem;
}
.comp-error {
  align-items: center;
}
.comp-loading {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 44rem;
  margin: 0 auto;
}
.comp-loading__title {
  width: 70%;
  height: 1.75rem;
}
.comp-loading__list {
  height: 20rem;
  margin-top: 0.75rem;
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius-lg);
}
</style>
