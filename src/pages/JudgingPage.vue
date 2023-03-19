<template>
    <f7-page>
        <f7-navbar>
        <f7-nav-left><f7-link back>back</f7-link></f7-nav-left>
        <f7-nav-title> {{ t('judging.judging_competitions') }} </f7-nav-title>
        </f7-navbar>
      
      <f7-block>
        <judging-component :compid="compid"></judging-component>
      </f7-block>
    </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted } from 'vue'
import JudgingComponent from '@components/judging/JudgingComponent.vue'
const { t } = useI18n()
const props = defineProps({
  f7router: Object,
  compid: Number,
})
</script>
