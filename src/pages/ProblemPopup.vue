<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import Problem from '@components/Problem.vue'
const props = defineProps({
  problem: Object,
  f7router : Object,
})
</script>
<template>
  <f7-popup class="demo-popup" :opened="popupOpened" @popup:closed="popupOpened = false">
    <f7-page>
      <f7-navbar :title="t('problem.problem_details')">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <problem :problem="problem" />
    </f7-page>
  </f7-popup>
</template>
