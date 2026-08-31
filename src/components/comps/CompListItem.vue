<template>
  <f7-list-item
    :link="`/competitions/` + comp.id"
    :title="comp.name"
    :after="comp.compdate"
    :text="getCompText(comp)"
  >
    <template #subtitle>
      {{ comp.location }}
      <span v-if="comp.participates"></span>
      <span v-else class="text-orange-400 font-bold">{{
        t('comps.not_registered')
      }}</span>
    </template>
  </f7-list-item>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
// The template reads `comp` directly (defineProps exposes props to the
// template by name on their own), so nothing here reads the return value —
// but the call itself must stay, or Vue never learns the prop exists.
defineProps({
    comp : Object,
})
const getCompText = (comp) => {
  return `${t('comps.registration_ends')} ${comp.registration_end}`
}
</script>
