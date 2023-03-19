<template>
   <f7-popup :opened="opened">
      <f7-page>
      <f7-navbar title="Tips and help">
        <f7-nav-right>
          <f7-link @click="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
          <h1 class="font-bold text-xl">Tips</h1>
          <f7-block-title>{{ t('I climbed one 7a three times, yet my ranking does not change') }}</f7-block-title>
          <f7-block strong inset>One problem is calculated only once. If you climb a problem eg. 3 times, with 3 tries, it is counted as one problem with 3 tries.</f7-block>
          <f7-block-title>{{ t('My name is not in the ranking') }}</f7-block-title>
          <f7-block strong inset>Usually two reasons.<br />1. Check that you have correct country in the settings.<br />2. Check that you have 'Ranking visibility' as true</f7-block>
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
          <f7-block-title>{{ t('How to delete ticks?') }}</f7-block-title>
          <f7-block strong inset>Two ways: 1. Go to tick archive, find the ticks and swipe left to delete. 2. Find the problem from problem list, open problem details, find "My ticks" from the left side and swipe left to delete.</f7-block>
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
const emit = defineEmits(['close'])
</script>
