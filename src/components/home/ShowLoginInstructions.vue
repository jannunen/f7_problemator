<template>
  <div class="login-wrapper">
    <div class="login-card">
      <!-- Logo & brand -->
      <div class="brand-section">
        <div class="p-ring logo-ring">
          <img :src="logo" alt="Problemator logo" class="logo-img" />
        </div>
        <h1 class="brand-title">Problemator</h1>
        <p class="brand-subtitle">{{ t('auth.track_journey') }}</p>
      </div>

      <!-- Tab switcher with sliding indicator -->
      <div class="p-segmented tab-switcher">
        <div
          class="p-segmented__indicator"
          :class="{ 'p-segmented__indicator--right': authType === 'signup' }"
        ></div>
        <button
          class="p-segmented__btn"
          :class="{ 'p-segmented__btn--active': authType === 'signin' }"
          @click="switchTab('signin')"
        >
          {{ t('auth.sign_in') }}
        </button>
        <button
          class="p-segmented__btn"
          :class="{ 'p-segmented__btn--active': authType === 'signup' }"
          @click="switchTab('signup')"
        >
          {{ t('auth.sign_up') }}
        </button>
      </div>

      <!-- Error message -->
      <Transition name="msg-slide">
        <div v-if="authError" class="error-banner">
          <svg class="msg-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
          </svg>
          <span>{{ authError }}</span>
        </div>
      </Transition>

      <!-- Social sign-in.
           Above the email form, not below it: Apple's guidelines require Sign
           in with Apple to be at least as prominent as any other option, and
           on a phone "further up" is what prominence means. -->
      <div v-if="socialAuthAvailable && authStep === 'idle'" class="social-section">
        <button
          v-for="p in PROVIDERS"
          :key="p"
          class="social-btn"
          :class="[`social-btn--${p}`, { 'is-loading': busyProvider === p }]"
          :disabled="busyProvider !== null"
          @click="signIn(p)"
        >
          <svg v-if="busyProvider === p" class="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
          </svg>
          <svg v-else-if="p === 'apple'" class="social-mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 12.54c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.19-1.72-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.87-.76-1.48.02-2.84.86-3.6 2.18-1.53 2.66-.39 6.6 1.1 8.76.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.87.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.21-2.48-.03-.01-2.32-.89-2.34-3.51zM14.9 5.6c.6-.74 1.01-1.76.9-2.78-.87.04-1.93.58-2.56 1.31-.56.65-1.05 1.69-.92 2.69.97.07 1.97-.49 2.58-1.22z" />
          </svg>
          <svg v-else class="social-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.46a5.52 5.52 0 01-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.83z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11A12 12 0 0012 24z" />
            <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 010-4.56V6.61H1.26a12 12 0 000 10.78l4.01-3.11z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
          </svg>
          <span>{{ t(`auth.continue_with_${p}`) }}</span>
        </button>

        <div class="social-divider"><span>{{ t('auth.or_with_email') }}</span></div>
      </div>

      <!-- Step 1: Email input -->
      <Transition name="step-fade" mode="out-in">
        <div v-if="authStep === 'idle'" key="idle" class="form-section">
          <TransitionGroup name="field-stagger" appear>
            <div v-if="authType === 'signup'" key="firstname" class="input-group" style="--delay: 0">
              <label class="input-label">{{ t('auth.first_name') }}</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                <input
                  v-model="etunimi"
                  type="text"
                  class="text-input"
                  :placeholder="t('auth.your_first_name')"
                />
              </div>
            </div>

            <div v-if="authType === 'signup'" key="lastname" class="input-group" style="--delay: 1">
              <label class="input-label">{{ t('auth.last_name') }}</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
                <input
                  v-model="sukunimi"
                  type="text"
                  class="text-input"
                  :placeholder="t('auth.your_last_name')"
                />
              </div>
            </div>

            <div key="email" class="input-group" style="--delay: 2">
              <label class="input-label">{{ t('auth.email') }}</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                </svg>
                <input
                  v-model="email"
                  type="email"
                  inputmode="email"
                  class="text-input"
                  placeholder="your@email.com"
                  @keyup.enter="sendOtp"
                />
              </div>
            </div>
          </TransitionGroup>

          <p-button
            class="btn-primary w-full submit-btn"
            :class="{ 'is-loading': sending }"
            @click="sendOtp"
            :disabled="sending"
          >
            <span class="btn-content">
              <svg v-if="sending" class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
              {{ sending ? t('auth.sending_code') : t('auth.send_code') }}
            </span>
          </p-button>
        </div>

        <!-- Step 2: OTP code entry -->
        <div v-else-if="authStep === 'otp_sent' || authStep === 'verifying'" key="otp" class="form-section">
          <div class="otp-info-banner">
            <svg class="msg-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
              <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
            </svg>
            <span>{{ t('auth.code_sent_to') }} <strong>{{ authEmail }}</strong></span>
          </div>

          <!-- Never reaches a real build: the API only returns debug_code with
               debug on and outside production. Labelled loudly so that if it
               ever does show up somewhere it shouldn't, it is obvious rather
               than mistaken for a feature. -->
          <div v-if="debugOtp" class="otp-debug">
            <span class="otp-debug__tag">DEBUG</span>
            <span class="otp-debug__code">{{ debugOtp }}</span>
          </div>

          <label class="input-label text-center">{{ t('auth.enter_code') }}</label>

          <!-- Individual OTP digit boxes -->
          <div class="otp-digits">
            <input
              v-for="(_, i) in 6"
              :key="i"
              :ref="el => { if (el) otpRefs[i] = el }"
              type="text"
              inputmode="numeric"
              maxlength="1"
              class="otp-box"
              :class="{ filled: otpDigits[i] }"
              :value="otpDigits[i]"
              autocomplete="one-time-code"
              @input="handleOtpInput(i, $event)"
              @keydown="handleOtpKeydown(i, $event)"
              @paste="handleOtpPaste($event)"
              @focus="$event.target.select()"
            />
          </div>

          <p-button
            class="btn-primary w-full submit-btn"
            :class="{ 'is-loading': authStep === 'verifying' }"
            @click="verifyCode"
            :disabled="authStep === 'verifying' || otpCode.length < 6"
          >
            <span class="btn-content">
              <svg v-if="authStep === 'verifying'" class="spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
              {{ authStep === 'verifying' ? t('auth.verifying') : t('auth.verify_code') }}
            </span>
          </p-button>

          <button class="back-link" @click="goBack">
            <svg class="back-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
            </svg>
            {{ t('auth.use_different_email') }}
          </button>
        </div>
      </Transition>

      <!-- Cookie notice -->
      <div class="cookie-notice">
        <svg class="cookie-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
        </svg>
        <span>{{ t('auth.cookie_notice') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import PButton from '@components/PButton.vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { ref, computed, reactive, watch, nextTick } from 'vue'
import logo from '../../assets/images/logo.png'
import { PROVIDERS } from '@helpers/socialAuth.js'
import { socialAuthAvailable } from '@js/supabase.js'

const { t } = useI18n()
const store = useStore()
const email = ref('')
const etunimi = ref('')
const sukunimi = ref('')
const otpDigits = reactive(['', '', '', '', '', ''])
const otpRefs = reactive([])
const sending = ref(false)
// Which provider is mid-flight, so its own button spins and the other is
// disabled rather than both showing the same indeterminate state.
const busyProvider = ref(null)

const authStep = computed(() => store.state.authStep)
const authEmail = computed(() => store.state.authEmail)
const debugOtp = computed(() => store.state.debugOtp)
const authType = computed(() => store.state.authType)
const authError = computed(() => store.state.authError)

const otpCode = computed(() => otpDigits.join(''))

const switchTab = (type) => {
  store.commit('setAuthType', type)
  store.commit('setAuthStep', 'idle')
  store.commit('setAuthError', null)
  clearOtp()
}

const clearOtp = () => {
  for (let i = 0; i < 6; i++) otpDigits[i] = ''
}

const handleOtpInput = (index, event) => {
  const val = event.target.value.replace(/\D/g, '')
  otpDigits[index] = val.slice(-1)
  event.target.value = otpDigits[index]
  if (val && index < 5) {
    nextTick(() => otpRefs[index + 1]?.focus())
  }
  if (otpCode.value.length === 6) {
    verifyCode()
  }
}

const handleOtpKeydown = (index, event) => {
  if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
    otpDigits[index - 1] = ''
    nextTick(() => otpRefs[index - 1]?.focus())
  }
}

const handleOtpPaste = (event) => {
  event.preventDefault()
  const text = (event.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    otpDigits[i] = text[i] || ''
  }
  const focusIndex = Math.min(text.length, 5)
  nextTick(() => otpRefs[focusIndex]?.focus())
  if (text.length === 6) {
    nextTick(() => verifyCode())
  }
}

const sendOtp = async () => {
  if (!email.value) return
  if (authType.value === 'signup' && (!etunimi.value || !sukunimi.value)) {
    store.commit('setAuthError', t('auth.enter_name_error'))
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

const signIn = async (provider) => {
  busyProvider.value = provider
  await store.dispatch('socialLogin', provider)
  busyProvider.value = null
}

const goBack = () => {
  store.commit('setAuthStep', 'idle')
  store.commit('setAuthError', null)
  clearOtp()
}

// Auto-focus first OTP box when entering OTP step
watch(authStep, (val) => {
  if (val === 'otp_sent') {
    nextTick(() => otpRefs[0]?.focus())
  }
})
</script>

<style scoped>
/* ─── Wrapper & Background ─── */
.login-wrapper {
  position: relative;
  min-height: 100dvh;
  display: flex;
  /* Top-aligned rather than centred: dead-centre put the mark halfway down
     the screen, below the fold of a thumb's reach and oddly low once the
     navbar is accounted for. The offset is viewport-relative so the card
     sits high on a phone without being glued to the navbar on a tablet. */
  align-items: flex-start;
  justify-content: center;
  padding: clamp(1rem, 6vh, 4rem) 1.5rem 1.5rem;
  overflow: hidden;
  /* No background of its own: the gradient and the wells of colour this
     screen used to paint for itself are now the ground under every page. */
}

/* .p-segmented supplies the control; the gap to the form below it is this
   screen's own rhythm, so it stays here. */
.tab-switcher {
  margin-bottom: 1.5rem;
}

/* Only the ring's contents need sizing; .p-ring supplies the circle. */
.logo-ring {
  margin-bottom: 0.75rem;
  animation: p-scale-in 0.8s var(--p-ease) both;
}


/* ─── Card ─── */
.login-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  z-index: 1;
}

/* ─── Brand ─── */
.brand-section {
  text-align: center;
  margin-bottom: 2rem;
}


.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.brand-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--p-text);
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 0;
  animation: text-enter 0.6s var(--p-ease) 0.1s both;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: var(--p-text-dim);
  margin-top: 0.35rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  animation: text-enter 0.6s var(--p-ease) 0.2s both;
}

@keyframes text-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── Debug OTP ─── */
.otp-debug {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 0.75rem 0 0.25rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--p-radius-sm);
  /* Warning colours on purpose. This is not part of the design — it is a
     development affordance, and it should never look at home here. */
  background: rgba(245, 158, 11, 0.1);
  border: 1px dashed rgba(245, 158, 11, 0.4);
}

.otp-debug__tag {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--p-warning);
}

.otp-debug__code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: var(--p-text);
  user-select: all;
}

/* ─── Tab Switcher ─── */





/* ─── Social sign-in ─── */
.social-section {
  margin-bottom: 1.25rem;
}

/* The brand marks are the only colour here. Both providers permit a dark
   button, which is what lets these sit in the app's own surface language
   instead of two white slabs punched through it. */
.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--p-text);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.social-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}

.social-btn:not(:disabled):active {
  transform: translateY(0);
}

.social-btn:disabled {
  cursor: default;
  opacity: 0.55;
}

.social-mark {
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
}

.social-divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0 0.25rem;
  font-size: 0.72rem;
  color: var(--p-text-dark);
  letter-spacing: 0.04em;
}

.social-divider::before,
.social-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
}

/* ─── Form ─── */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.input-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--p-text-muted);
  margin-bottom: 0.4rem;
  letter-spacing: 0.02em;
}

.input-label.text-center {
  text-align: center;
  margin-bottom: 0.75rem;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--p-text-dark);
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-wrapper:focus-within .input-icon {
  color: var(--p-accent);
}

.text-input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--p-text);
  font-size: 0.9rem;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.text-input::placeholder {
  color: var(--p-text-dark);
}

.text-input:focus {
  border-color: rgba(var(--p-accent-rgb), 0.4);
  background: rgba(var(--p-accent-rgb), 0.04);
  box-shadow: 0 0 0 3px rgba(var(--p-accent-rgb), 0.08);
}

/* ─── OTP Digits ─── */
.otp-digits {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.otp-box {
  width: 48px;
  height: 56px;
  border-radius: 10px;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--p-text);
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
  caret-color: var(--p-accent);
}

.otp-box:focus {
  border-color: rgba(var(--p-accent-rgb), 0.5);
  background: rgba(var(--p-accent-rgb), 0.06);
  box-shadow: 0 0 0 3px rgba(var(--p-accent-rgb), 0.1);
  transform: translateY(-1px);
}

.otp-box.filled {
  border-color: rgba(var(--p-accent-rgb), 0.25);
  background: rgba(var(--p-accent-rgb), 0.04);
}

/* ─── Submit Button ─── */
.submit-btn {
  margin-top: 0.5rem;
  border-radius: 10px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  transition: all 0.25s ease !important;
  position: relative;
  overflow: hidden;
}

.submit-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(var(--p-accent-rgb), 0.2);
}

.submit-btn:not(:disabled):active {
  transform: translateY(0);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 1.1rem;
  height: 1.1rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Back Link ─── */
.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1rem;
  padding: 0.5rem;
  font-size: 0.82rem;
  color: var(--p-text-dim);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  width: 100%;
}

.back-link:hover {
  color: var(--p-text-muted);
}

.back-icon {
  width: 1rem;
  height: 1rem;
}

/* ─── Message Banners ─── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--p-danger-tint);
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.otp-info-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(var(--p-accent-rgb), 0.08);
  border: 1px solid rgba(var(--p-accent-rgb), 0.15);
  color: var(--p-accent-tint);
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.msg-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

/* ─── Cookie Notice ─── */
.cookie-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.72rem;
  color: var(--p-text-dark);
  line-height: 1.5;
}

.cookie-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  margin-top: 1px;
  opacity: 0.6;
}

/* ─── Transitions ─── */
.step-fade-enter-active,
.step-fade-leave-active {
  transition: all 0.3s var(--p-ease);
}

.step-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.step-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

.msg-slide-enter-active,
.msg-slide-leave-active {
  transition: all 0.3s ease;
}

.msg-slide-enter-from,
.msg-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.field-stagger-enter-active {
  transition: all 0.35s var(--p-ease);
  transition-delay: calc(var(--delay, 0) * 0.06s);
}

.field-stagger-leave-active {
  transition: all 0.2s ease;
}

.field-stagger-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.field-stagger-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
