<template>
  <f7-popup class="read-qr-popup" :opened="opened" @popup:closed="emit('close')">
    <f7-page>
      <f7-navbar :title="t('searchprob.scan_qr_code')">
        <f7-nav-right>
          <f7-link @click.prevent="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <h1 class="font-bold my-2 text-2xl">{{ t('searchprob.scan_qr_code_title') }}</h1>
        <p class="p-1">{{ t('searchprob.scan_qr_code_explainer') }}</p>
        <qrcode-stream v-if="opened" @decode="onDecode" />
        <!--
        <f7-button @click="onDecode('http://localhost:3000/#!/problem/67243')">Test decode</f7-button>
        -->
      </f7-block>
    </f7-page>
  </f7-popup>
</template>
<script setup>
  import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'
  import { QrcodeStream } from 'vue3-qrcode-reader'
  const { t } = useI18n()
  const props = defineProps({
    opened  : Boolean
    })
  const emit = defineEmits(['close'])
  const onDecode = (code) => {

    // The QR code has format https://pwa.problemator.fi/#!/problem/67243
    code = "https://pwa.problemator.fi/#!/problem/67243"
    const matches = code.match(/.*?(\d+)/)
    if (matches !== false) {
      const problemid = matches[1]
      emit('close')
       f7.views.main.router.navigate('/problem/' + problemid + '/popup')
    }

  }
   const  onInit = async (promise) => {

    try {
      const { capabilities } = await promise
      // successfully initialized
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        // user denied camera access permisson
      } else if (error.name === 'NotFoundError') {
        // no suitable camera device installed
      } else if (error.name === 'NotSupportedError') {
        // page is not served over HTTPS (or localhost)
      } else if (error.name === 'NotReadableError') {
        // maybe camera is already in use
      } else if (error.name === 'OverconstrainedError') {
        // did you requested the front camera although there is none?
      } else if (error.name === 'StreamApiNotSupportedError') {
        // browser seems to be lacking features
      }
    } finally {
      // hide loading indicator
    }
}
</script>
