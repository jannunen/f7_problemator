<template>
   <f7-popup :opened="opened">
      <f7-page>
      <f7-navbar title="Release notes">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block >
        <release-note title="0.8.33 (2022-10-30)" :notes="['Fixed some issues with small screen','Added change notes']" />
        <release-note title="0.8.32 (2022-10-30)" :notes="['Fixed result view layout','Added better refresh countdown indicator for result list' ]" />



      </f7-block>
      </f7-page>
    </f7-popup> 
    
</template>
<script setup>
import ReleaseNote from '@components/ui/ReleaseNote.vue'
defineProps({
  opened : Boolean,
})
</script>
