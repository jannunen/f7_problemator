<template>
  <div class="m-3">
    <h1 class="text-3xl text-white font-bold text-center">Problemator</h1>

    <div class="flex justify-center items-center my-4">
      <img :src="logo" alt="Problemator logo" class="w-32" />
    </div>

    <!-- Tab buttons -->
    <div class="flex justify-center mb-4">
      <button
        class="px-4 py-2 font-bold rounded-l-md"
        :class="authType === 'signin' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300'"
        @click="switchTab('signin')"
      >Sign In</button>
      <button
        class="px-4 py-2 font-bold rounded-r-md"
        :class="authType === 'signup' ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-300'"
        @click="switchTab('signup')"
      >Sign Up</button>
    </div>

    <!-- Error message -->
    <div v-if="authError" class="p-3 bg-red-600 border border-red-400 rounded-md text-white mb-4 text-center">
      {{ authError }}
    </div>

    <!-- Step 1: Email input -->
    <div v-if="authStep === 'idle'">
      <div class="mb-3" v-if="authType === 'signup'">
        <label class="block text-sm text-gray-300 mb-1">First name</label>
        <input
          v-model="etunimi"
          type="text"
          class="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600"
          placeholder="First name"
        />
      </div>
      <div class="mb-3" v-if="authType === 'signup'">
        <label class="block text-sm text-gray-300 mb-1">Last name</label>
        <input
          v-model="sukunimi"
          type="text"
          class="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600"
          placeholder="Last name"
        />
      </div>
      <div class="mb-3">
        <label class="block text-sm text-gray-300 mb-1">Email</label>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          class="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600"
          placeholder="your@email.com"
          @keyup.enter="sendOtp"
        />
      </div>
      <p-button
        class="btn-primary w-full"
        @click="sendOtp"
        :disabled="sending"
      >{{ sending ? 'Sending...' : 'Send verification code' }}</p-button>
    </div>

    <!-- Step 2: OTP code entry -->
    <div v-if="authStep === 'otp_sent' || authStep === 'verifying'">
      <div class="p-3 bg-sky-600 border border-sky-300 rounded-md text-white mb-4 text-center">
        Verification code sent to <strong>{{ authEmail }}</strong>
      </div>
      <div class="mb-3">
        <label class="block text-sm text-gray-300 mb-1">Enter 6-digit code</label>
        <input
          v-model="otpCode"
          type="text"
          inputmode="numeric"
          maxlength="6"
          class="w-full p-3 rounded-md bg-gray-800 text-white border border-gray-600 text-center text-2xl tracking-widest"
          placeholder="000000"
          autocomplete="one-time-code"
          @keyup.enter="verifyCode"
        />
      </div>
      <p-button
        class="btn-primary w-full mb-3"
        @click="verifyCode"
        :disabled="authStep === 'verifying' || otpCode.length < 6"
      >{{ authStep === 'verifying' ? 'Verifying...' : 'Verify' }}</p-button>
      <p-button
        class="bg-gray-700 w-full"
        @click="goBack"
      >Back</p-button>
    </div>

    <div class="mt-4 text-sm text-gray-400">
      <h2 class="font-bold my-2">Cookie policy</h2>
      We <strong>do use</strong> cookies, as does almost every web app.
      We're not selling your soul to third parties. By logging in you accept
      our usage of cookies. We use cookies to track your climbing, and that's it.
    </div>
  </div>
</template>

<script setup>
import PButton from '@components/PButton.vue'
import { useStore } from 'vuex'
import { ref, computed } from 'vue'
import logo from '../../assets/images/logo.png'

const store = useStore()
const email = ref('')
const etunimi = ref('')
const sukunimi = ref('')
const otpCode = ref('')
const sending = ref(false)

const authStep = computed(() => store.state.authStep)
const authEmail = computed(() => store.state.authEmail)
const authType = computed(() => store.state.authType)
const authError = computed(() => store.state.authError)

const switchTab = (type) => {
  store.commit('setAuthType', type)
  store.commit('setAuthStep', 'idle')
  store.commit('setAuthError', null)
  otpCode.value = ''
}

const sendOtp = async () => {
  if (!email.value) return
  if (authType.value === 'signup' && (!etunimi.value || !sukunimi.value)) {
    store.commit('setAuthError', 'Please enter your first and last name.')
    return
  }
  sending.value = true
  await store.dispatch('requestOtp', { email: email.value, type: authType.value })
  sending.value = false
}

const verifyCode = async () => {
  if (otpCode.value.length < 6) return
  const payload = {
    email: authEmail.value,
    code: otpCode.value,
    type: authType.value,
  }
  if (authType.value === 'signup') {
    payload.etunimi = etunimi.value
    payload.sukunimi = sukunimi.value
  }
  await store.dispatch('verifyOtp', payload)
}

const goBack = () => {
  store.commit('setAuthStep', 'idle')
  store.commit('setAuthError', null)
  otpCode.value = ''
}
</script>
