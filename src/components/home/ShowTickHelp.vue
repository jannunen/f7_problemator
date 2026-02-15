<template>
   <f7-popup :opened="!tipShown(tipShowStatus, 'welcome_home')">
      <f7-page>
      <f7-navbar title="Import old ticks/ascents">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <div class="p-4">
        <h2 class="text-lg font-bold text-center mb-3" style="color: var(--p-text);">{{ t('How to import old ascents') }}</h2>
        <p class="text-sm mb-3" style="color: var(--p-text-secondary); line-height: 1.6;">
          If you seem to have no ticks but you had an account before, there are two things you can do.
        </p>

        <ul class="text-sm mb-4 ml-4" style="color: var(--p-text-muted); line-height: 1.6; list-style: disc;">
          <li class="mb-2">If you used an email to login or you used Facebook login,
          you can import those ascents by entering the email you used
          and following the instructions you get in the email.</li>
          <li>If you used Facebook login and the email method does not work,
          send us an email and let's sort this out. Email us to <a href="mailto:info@problemator.fi" class="p-link">info@problemator.fi</a></li>
        </ul>

        <div class="mb-4">
          <label class="text-xs font-semibold uppercase mb-1 block" style="color: var(--p-text-muted); letter-spacing: 0.06em;">E-mail</label>
          <input
            type="email"
            v-model="email"
            placeholder="Your e-mail"
            class="p-input"
          />
        </div>
        <button class="p-btn p-btn--primary p-btn--block" @click="startSync">Send instructions</button>

        <div v-if="requestDone" class="p-banner p-banner--info mt-4">
          <span class="material-icons p-banner__icon">check_circle</span>
          <div class="p-banner__content">
            {{ ret.message }}
            <br /><br />
            We will log you out in 20secs. Follow the instructions you get into your
            email, and then login again.
          </div>
        </div>
      </div>
      </f7-page>
    </f7-popup>

</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { tipShown } from '@js/helpers'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { f7  } from 'framework7-vue'

const store = useStore()
const climber = computed(() => store.state.climber)
const tipShowStatus = computed(() => store.state.tipShowStatus)
const ret = ref({message : null})
const email = ref(null)
const requestDone = ref(false)
const { t } = useI18n()
const startSync = (which) => {
  const payload = {
    climberid : climber.value.id,
    email : email.value
  }
  store.dispatch('requestSync', payload)
  .then(resp => {
    ret.value = resp
    requestDone.value = true
    setTimeout(() => {
      store.dispatch('logout')
      f7.views.main.router.navigate("/")
    },15000)
  })
}
</script>
