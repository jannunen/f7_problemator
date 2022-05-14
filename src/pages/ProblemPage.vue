<script setup>
import Problem from '@components/Problem.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  problem: Object,
  f7router: Object,
  id : Number,
})
</script>
<template>
  <f7-page>
    <f7-navbar :title="t('problem.problem_details')" back-link> </f7-navbar>
    <problem :problem="problem" :id="id" />
  </f7-page>
</template>
