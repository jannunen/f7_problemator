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
import store from '@js/store.js'
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
const store = useStore()
const { t } = useI18n()
const props = defineProps({
    comp : Object,
})
const getCompText = (comp) => {
  return `${t('comps.registration_ends')} ${comp.registration_end}`
}
</script>
