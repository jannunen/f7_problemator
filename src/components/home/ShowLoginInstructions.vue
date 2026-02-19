<template>
  <div class="login-wrapper">
    <!-- Decorative background shapes -->
    <div class="bg-shapes" aria-hidden="true">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div class="login-card">
      <!-- Logo & brand -->
      <div class="brand-section">
        <div class="logo-ring">
          <img :src="logo" alt="Problemator logo" class="logo-img" />
        </div>
        <h1 class="brand-title">Problemator</h1>
        <p class="brand-subtitle">{{ t('auth.track_journey') }}</p>
      </div>

      <!-- Tab switcher with sliding indicator -->
      <div class="tab-switcher">
        <div
          class="tab-indicator"
          :class="{ 'tab-right': authType === 'signup' }"
        ></div>
        <button
          class="tab-btn"
          :class="{ active: authType === 'signin' }"
          @click="switchTab('signin')"
        >
          {{ t('auth.sign_in') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: authType === 'signup' }"
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

const { t } = useI18n()
const store = useStore()
const email = ref('')
const etunimi = ref('')
const sukunimi = ref('')
const otpDigits = reactive(['', '', '', '', '', ''])
const otpRefs = reactive([])
const sending = ref(false)

const authStep = computed(() => store.state.authStep)
const authEmail = computed(() => store.state.authEmail)
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
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: hidden;
  background: linear-gradient(145deg, #0c1220 0%, #162032 50%, #0e1a2a 100%);
}

.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: #38bdf8;
  top: -120px;
  right: -80px;
  animation: float-slow 20s ease-in-out infinite;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: #22d3ee;
  bottom: -60px;
  left: -100px;
  animation: float-slow 25s ease-in-out infinite reverse;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: #a78bfa;
  top: 40%;
  left: 60%;
  animation: float-slow 18s ease-in-out infinite 3s;
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 15px) scale(0.95); }
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

.logo-ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.08);
  border: 2px solid rgba(56, 189, 248, 0.15);
  margin-bottom: 0.75rem;
  animation: logo-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.logo-img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.brand-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  line-height: 1;
  margin: 0;
  animation: text-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.35rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  animation: text-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
}

@keyframes logo-enter {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes text-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── Tab Switcher ─── */
.tab-switcher {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.tab-indicator.tab-right {
  transform: translateX(100%);
}

.tab-btn {
  flex: 1;
  position: relative;
  z-index: 1;
  padding: 0.6rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.25s ease;
  border-radius: 8px;
  letter-spacing: 0.01em;
}

.tab-btn.active {
  color: #e2e8f0;
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
  color: #94a3b8;
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
  color: #475569;
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-wrapper:focus-within .input-icon {
  color: #38bdf8;
}

.text-input {
  width: 100%;
  padding: 0.75rem 0.85rem 0.75rem 2.5rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #f1f5f9;
  font-size: 0.9rem;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
}

.text-input::placeholder {
  color: #475569;
}

.text-input:focus {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.04);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.08);
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
  color: #f1f5f9;
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
  caret-color: #38bdf8;
}

.otp-box:focus {
  border-color: rgba(56, 189, 248, 0.5);
  background: rgba(56, 189, 248, 0.06);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
  transform: translateY(-1px);
}

.otp-box.filled {
  border-color: rgba(56, 189, 248, 0.25);
  background: rgba(56, 189, 248, 0.04);
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
  box-shadow: 0 4px 16px rgba(56, 189, 248, 0.2);
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
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  width: 100%;
}

.back-link:hover {
  color: #94a3b8;
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
  color: #fca5a5;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.otp-info-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
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
  color: #475569;
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
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
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
