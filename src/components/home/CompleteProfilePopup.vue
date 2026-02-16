<template>
  <f7-popup :opened="showPopup" @popup:closed="showPopup = false">
    <f7-page>
      <f7-navbar title="Complete your profile">
        <f7-nav-right>
          <f7-link @click="skip">Skip</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <p class="mb-4">
          Welcome! Your profile is missing some details.
          Fill in what you'd like to share — all fields are optional.
        </p>
      </f7-block>
      <f7-list>
        <f7-list-input
          label="First name"
          type="text"
          placeholder="Your first name"
          v-model:value="form.etunimi"
          clear-button
        />
        <f7-list-input
          label="Last name"
          type="text"
          placeholder="Your last name"
          v-model:value="form.sukunimi"
          clear-button
        />
        <f7-list-input
          label="Gender"
          type="select"
          v-model:value="form.gender"
          placeholder="Please choose..."
        >
          <option value="">-- select --</option>
          <option value="m">Male</option>
          <option value="f">Female</option>
          <option value="unset">Prefer not to say</option>
        </f7-list-input>
        <f7-list-item>
          <select v-model="form.maa">
            <option value="">-- select country --</option>
            <option v-for="country in getNames()" :value="country" :key="country">{{ country }}</option>
          </select>
        </f7-list-item>
      </f7-list>
      <f7-block>
        <button class="btn-primary w-full" @click="save">Save</button>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { toaster } from '@js/helpers/notifications.js'
import { getNames } from 'country-list'

const store = useStore()
const climber = computed(() => store.state.climber)
const showPopup = ref(false)

const form = ref({
  etunimi: '',
  sukunimi: '',
  gender: '',
  maa: '',
})

const needsProfile = (c) => {
  if (!c) return false
  const name = ((c.etunimi || '') + ' ' + (c.sukunimi || '')).trim().toLowerCase()
  return name === 'please enter' || name === 'please enter please enter'
    || (c.etunimi || '').toLowerCase() === 'please enter'
}

watch(climber, (c) => {
  if (needsProfile(c)) {
    // Pre-fill with existing values that aren't the placeholder
    form.value.gender = c.gender || ''
    form.value.maa = c.maa || ''
    showPopup.value = true
  }
}, { immediate: true })

const skip = () => {
  showPopup.value = false
}

const save = () => {
  const payload = { ...climber.value, ...form.value }
  store.dispatch('saveSettings', payload).then((ret) => {
    toaster('Profile updated!')
    showPopup.value = false
  })
}
</script>
