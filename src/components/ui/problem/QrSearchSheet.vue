<template>
  <f7-popup class="read-qr-popup" :opened="opened" @popup:closed="onPopupClosed">
    <f7-page>
      <f7-navbar :title="t('searchprob.scan_qr_code')">
        <f7-nav-right>
          <f7-link @click.prevent="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <h1 class="font-bold my-2 text-2xl">{{ t('searchprob.scan_qr_code_title') }}</h1>
        <p class="p-1">{{ t('searchprob.scan_qr_code_explainer') }}</p>

        <!-- The :key forces a genuinely new component instance on every open.
             Without it a camera stream held over from the previous scan could
             be reused, and the second scan silently failed. -->
        <qrcode-stream
          v-if="opened"
          :key="scanSession"
          @detect="onDetect"
          @init="onInit"
        />

        <!-- Every branch of the old error handler was empty, so a camera that
             failed to start showed nothing at all — which is why a failed
             second scan looked like the reader simply not recognising the
             code. Say what went wrong and what to do about it. -->
        <div v-if="cameraError" class="p-3 mt-3 qr-error">
          <p class="font-bold">{{ cameraError.title }}</p>
          <p class="text-sm">{{ cameraError.hint }}</p>
          <f7-button fill class="mt-2" @click="retry">
            {{ t('searchprob.try_again') }}
          </f7-button>
        </div>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'
import { QrcodeStream } from 'vue3-qrcode-reader'
import { extractProblemId, describeCameraError } from '@js/helpers/qr.js'

const { t } = useI18n()
const props = defineProps({
  opened: Boolean,
})
const emit = defineEmits(['close'])

// Bumping this remounts the reader, which is the only reliable way to get a
// fresh camera stream out of the library.
const scanSession = ref(0)
const cameraError = ref(null)
// One scan per open. Without this a steady camera fired detect repeatedly and
// pushed the same route several times.
const handled = ref(false)

watch(
  () => props.opened,
  (isOpen) => {
    if (isOpen) {
      cameraError.value = null
      handled.value = false
      scanSession.value += 1
    }
  }
)

const retry = () => {
  cameraError.value = null
  handled.value = false
  scanSession.value += 1
}

const onPopupClosed = () => {
  emit('close')
}

const onDetect = async (detectedCodes) => {
  if (handled.value) return

  // The library has passed a promise in some versions and a value in others.
  if (detectedCodes && typeof detectedCodes.then === 'function') {
    detectedCodes = await detectedCodes
  }
  if (!detectedCodes) return

  // ...and either a single object with .content, or an array of them.
  const first = Array.isArray(detectedCodes) ? detectedCodes[0] : detectedCodes
  const problemData = first?.content ?? first?.rawValue
  if (!problemData) return

  const problemid = extractProblemId(problemData)
  if (problemid == null) {
    // A QR code that is not one of ours is a normal thing to point a camera
    // at. Say so rather than appearing to do nothing.
    cameraError.value = {
      title: t('searchprob.qr_not_recognised_title'),
      hint: t('searchprob.qr_not_recognised_hint'),
    }
    return
  }

  handled.value = true
  emit('close')
  f7.views.main.router.navigate('/problem/' + problemid + '/popup')
}

const onInit = async (promise) => {
  try {
    await promise
    cameraError.value = null
  } catch (error) {
    cameraError.value = describeCameraError(error, t)
  }
}
</script>


<style scoped>
.qr-error {
  border: 1px solid rgba(255, 0, 0, 0.25);
  border-radius: 8px;
  background: rgba(255, 0, 0, 0.06);
}
</style>
