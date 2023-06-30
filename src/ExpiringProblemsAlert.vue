<template>
  <div>
    {{ expiringProblems }}
  </div>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import {  computed } from 'vue'
const { t } = useI18n()
const store = useStore()
const problems = computed(() => store.state.problems)
const expiringProblems = computed(() => {
  if (problems.value == null) {
  return []
  }
  return problems.value.filter(p => p.soontoberemoved == 1 )
})
</script>
