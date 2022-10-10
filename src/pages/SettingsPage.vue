<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, onMounted } from 'vue'
import { useStore } from 'vuex'
import { toaster, alert } from '@js/helpers/notifications.js'
const store = useStore()
const { t } = useI18n()
const props = defineProps({
  f7router: Object,
})
const profile = computed(() => store.state.profile)

const genders = ref([
    { id : 'm', name : 'male' },
    { id : 'f', name : 'female' },
    { id : 'unset', name : 'none of your business' },
])
const ascentTypes = ref([
    { id : '0', name : 'lead' },
    { id : '1', name : 'top-rope' },
])
const saveSettings = () => {
    store.dispatch('saveSettings',settings.value)
    .then(ret => {
      toaster(ret.message)
    })
}
const isChecked = (field) => {
    const val =  settings.value[field];
    return parseInt(val) == 1
}
const toggleTrueFalseWithNumber = (field, boolikka) => {
    if (boolikka) {
        settings.value[field] = 1
    } else {
        settings.value[field] = 0

    }
}
const settings = ref({})
watch(profile,(newValue, oldValue) => {
    if (newValue.settings != null) {
        settings.value = {...newValue.settings}
    }
})

</script>
<template>
  <f7-page>
    <f7-navbar>
              
       <f7-nav-left>
           <f7-link href="/">&lt; <f7-icon
                md="material:home"
                aurora="f7:home"
                ios="f7:home"
              /></f7-link>
              </f7-nav-left>
       <f7-nav-title> {{ t('settings.settings_title') }} </f7-nav-title>
    </f7-navbar>
    <f7-block>
        <f7-block strong>
            <p>
             Here are your personal settings. You can toggle some visibility items 
             and some convenience settings.
            </p>
        </f7-block>
        <f7-list>
              <f7-block-title>Personal details (optional)</f7-block-title>
               <f7-list-input
                    label="First name"
                    type="text"
                    placeholder="Your first name"
                    v-model:value="settings.etunimi"
                    clear-button
                >
               </f7-list-input>
               <f7-list-input
                    label="Last name"
                    type="text"
                    placeholder="Your last name"
                    v-model:value="settings.sukunimi"
                    clear-button
                >
               </f7-list-input>

                <f7-list-input
                    label="Gender"
                    type="select"
                    v-model:value="settings.gender"
                    placeholder="Please choose..."
                >
                    <option v-for="gender in genders" :value="gender.id" :key="gender.id">{{ gender.name }}</option>
                </f7-list-input>
        </f7-list>
        <f7-list>

              <f7-block-title>Default ascent type</f7-block-title>
                <f7-list-input
                    label="Affects only sport climbing"
                    type="select"
                    v-model:value="settings.sport_tick_ascent_type"
                    placeholder="Please choose..."
                >
                    <option v-for="ascentType in ascentTypes" :value="ascentType.id" :key="ascentType.id">{{ ascentType.name }}</option>
                </f7-list-input>
        </f7-list>
        <f7-list>
              <f7-block-title>Visibility settings</f7-block-title>

            <f7-list-item title="Ranking visibility">
            <template #after>
                <f7-toggle @toggle:change="(val) => toggleTrueFalseWithNumber('showinranking',val)" :checked="isChecked('showinranking')"></f7-toggle>
            </template>
            </f7-list-item>
            <f7-list-item title="Show my ascents to others">
            <template #after>
                <f7-toggle @toggle:change="(val) => toggleTrueFalseWithNumber('publicascents',val)" :checked="isChecked('publicascents')"></f7-toggle>
            </template>
            </f7-list-item>
        </f7-list>
        <button class="btn-primary" @click="saveSettings" block>Save settings</button>
    </f7-block>
  
  </f7-page>
</template>
