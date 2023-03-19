<template>
   <f7-popup :opened="!tipShown(tipShowStatus, 'welcome_home')">
      <f7-page>
      <f7-navbar title="Import old ticks/ascents">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block class="text-center">
          <f7-block-title>{{ t('How to import old ascents') }}</f7-block-title>
           If you seem to have no ticks
          but you had an account before, there are two things you can do.

          <ul class="list-disc my-2 mx-8">
          <li>If you used an email to login or you used Facebook login,
          you can import those ascents by entering the email you used
          and following the instructions you get in the email.
          </li>
          <li>If you used Facebook login and the email method does not work,
          send us an email and let's sort this out. Email us to <a href="mailto:info@problemator.fi">info@problemator.fi</a></li>
          </ul>

          <f7-list no-hairlines-md>
          <f7-list-input
            label="E-mail"
            type="email"
            v-model:value="email"
            placeholder="Your e-mail"
            clear-button
          ></f7-list-input>
          </f7-list>
          <p-button class="bg-blue-500" @click="startSync">Send instructions</p-button>

          <div class="border-2 border-green-300 bg-green-600 p-3 m-3" v-if="requestDone">
          {{ ret.message }}
          <br /><br />
          We will log you out in 20secs. Follow the instructions you get into your 
          email, and then login again.
          </div>

      </f7-block>
      </f7-page>
    </f7-popup> 
    
</template>
<script setup>
import PButton from '@components/PButton.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useI18n } from 'vue-i18n'
import { tipShown } from '@js/helpers'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { f7  } from 'framework7-vue'

const {
  idTokenClaims,
  getAccessTokenSilently,
  loginWithRedirect,
  logout,
  user,
} = useAuth0()

const store = useStore()
const climber = computed(() => store.state.climber)
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
      logout()
      localStorage.setItem('token', null)
      store.commit('setSidePanel', false)
      store.commit('setSelectedLeftPanelItem', 'logout')
      store.commit('isAuthenticated', false)
      f7.views.main.router.navigate("/")
    },15000)
  })
}
</script>