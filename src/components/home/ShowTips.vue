<template>
   <f7-popup :opened="opened">
      <f7-page>
      <f7-navbar title="Tips and help">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
          <h1 class="font-bold text-xl">Tips</h1>
          <f7-block-title>{{ t('Add Problemator to home screen') }}</f7-block-title>
          <f7-block strong inset>Click share icon from your browser and find 'Add to home screen'.</f7-block>
          <f7-block-title>{{ t('Quick add tries/ticks') }}</f7-block-title>
          <f7-block strong inset>On the <strong>Problem list</strong>, swipe right for a try, left for a tick</f7-block>
          <f7-block-title>{{ t('Show new problems') }}</f7-block-title>
          <f7-block strong inset>From problem list open filtering and choose 'Sort by newest'</f7-block>
          <f7-block-title>{{ t('Reading QR Codes') }}</f7-block-title>
          <f7-block strong inset>Click the '+ Add' icon on the main page, then choose "Read QR" and point to the QR code on the problem sticker.</f7-block>
          <f7-block-title>{{ t('How do I see my old ticks?') }}</f7-block-title>
          <f7-block strong inset>Open menu (top right on the main page) and choose 'Tick archive'</f7-block>
      </f7-block>
      </f7-page>
    </f7-popup> 
    
</template>
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps({
  opened : Boolean,
})
</script>
