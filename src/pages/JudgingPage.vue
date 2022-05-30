<template>
    <f7-page>
      <f7-navbar title="Judging sheet">
        <f7-nav-left back>back</f7-nav-left>
      </f7-navbar>
      <f7-block>
        <judging-component :compid="compid"></judging-component>
      </f7-block>
    </f7-page>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue'
import JudgingComponent from '@components/judging/JudgingComponent.vue'
const props = defineProps({
  f7router: Object,
  compid: Number,
})
</script>
