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
    <f7-navbar>
       <f7-nav-left><f7-link href="/">&lt; problem list</f7-link></f7-nav-left>
       <f7-nav-title> {{ t('problem.problem_details') }} </f7-nav-title>
    </f7-navbar>
    <problem :problem="problem" :id="id" />
  </f7-page>
</template>
