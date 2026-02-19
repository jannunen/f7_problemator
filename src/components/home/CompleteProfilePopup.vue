<template>
  <f7-popup :opened="showPopup" @popup:closed="showPopup = false">
    <f7-page>
      <f7-navbar :title="t('complete_profile.title')">
        <f7-nav-right>
          <f7-link @click="skip">{{ t('complete_profile.skip') }}</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <p class="mb-4">
          {{ t('complete_profile.welcome') }}
        </p>
      </f7-block>
      <f7-list>
        <f7-list-input
          :label="t('complete_profile.first_name')"
          type="text"
          :placeholder="t('complete_profile.your_first_name')"
          v-model:value="form.etunimi"
          clear-button
        />
        <f7-list-input
          :label="t('complete_profile.last_name')"
          type="text"
          :placeholder="t('complete_profile.your_last_name')"
          v-model:value="form.sukunimi"
          clear-button
        />
        <f7-list-input
          :label="t('complete_profile.gender')"
          type="select"
          v-model:value="form.gender"
          :placeholder="t('complete_profile.please_choose')"
        >
          <option value="">{{ t('complete_profile.select_gender') }}</option>
          <option value="m">{{ t('complete_profile.male') }}</option>
          <option value="f">{{ t('complete_profile.female') }}</option>
          <option value="unset">{{ t('complete_profile.prefer_not_to_say') }}</option>
        </f7-list-input>
        <f7-list-item>
          <select v-model="form.maa">
            <option value="">{{ t('complete_profile.select_country') }}</option>
            <option v-for="country in getNames()" :value="country" :key="country">{{ country }}</option>
          </select>
        </f7-list-item>
      </f7-list>
      <f7-block>
        <button class="btn-primary w-full" @click="save">{{ t('complete_profile.save') }}</button>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { toaster } from '@js/helpers/notifications.js'
import { getNames } from 'country-list'

const { t } = useI18n()
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
    toaster(t('complete_profile.profile_updated'))
    showPopup.value = false
  })
}
</script>
