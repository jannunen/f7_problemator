<template>
  <f7-popup>
    <f7-page>
      <f7-navbar title="Judging sheet">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
        <judging-component :compid="compid"></judging-component>
    </f7-page>
  </f7-popup>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue'
import JudgingComponent from '@components/judging/JudgingComponent.vue'
const props = defineProps({
  f7router: Object,
  compid: Number,
})
</script>
