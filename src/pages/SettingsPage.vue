<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link href="/">&lt;
                    <f7-icon md="material:home" aurora="f7:home" ios="f7:home" />
                </f7-link>
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
            <f7-list v-if="climber != null">
                <f7-block-title>Personal details (optional)</f7-block-title>
                <f7-list-input label="First name" type="text" placeholder="Your first name" v-model:value="climber.etunimi" clear-button> </f7-list-input>
                <f7-list-input label="Last name" type="text" placeholder="Your last name" v-model:value="climber.sukunimi" clear-button> </f7-list-input>
                <f7-list-input label="Email (read only)" type="text" readonly :value="climber.email"> </f7-list-input>
                <f7-list-input label="Height" type="text" placeholder="in cm" v-model:value="climber.height"> </f7-list-input>
                <f7-list-input label="Ape index" placeholder="eg. +9" type="text" v-model:value="climber.apeindex"> </f7-list-input>
                <f7-list-input label="Team" placeholder="Enter team" type="text" v-model:value="climber.team"> </f7-list-input>
                <f7-list-input label="City" placeholder="Enter city" type="text" v-model:value="climber.city"> </f7-list-input>
                <f7-list-item>
                <select type="select" label="Country" v-model="climber.maa">
                    <option v-for="country in getNames()" :value="country" :key="country">{{ country }}</option>
                </select>
                </f7-list-item>
                <f7-list-input label="Gender" type="select" v-model:value="climber.gender" placeholder="Please choose...">
                    <option v-for="gender in genders" :value="gender.id" :key="gender.id">{{ gender.name }}</option>
                </f7-list-input>
            </f7-list>
            <f7-list>

                <f7-block-title>Default ascent type</f7-block-title>
                <f7-list-input label="Affects only sport climbing" type="select" v-model:value="settings.sport_tick_ascent_type" placeholder="Please choose...">
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
<script setup>
import { useI18n } from 'vue-i18n'
import { onMounted, ref,  computed } from 'vue'
import { useStore } from 'vuex'
import { toaster, alert } from '@js/helpers/notifications.js'
import { getNames } from 'country-list'
const store = useStore()
const { t } = useI18n()
const props = defineProps({
    f7router: Object,
})
const profile = computed(() => store.state.profile.settings)
const climberStore = computed(() => store.state.climber)
const settings = ref({})
const climber = ref(null)

onMounted(() => {
    const parsed = JSON.parse(JSON.stringify(profile.value))
    settings.value = {...parsed}
    climber.value = JSON.parse(JSON.stringify(climberStore.value))
})

const genders = ref([
    { id: 'm', name: 'male' },
    { id: 'f', name: 'female' },
    { id: 'unset', name: 'none of your business' },
])
const ascentTypes = ref([
    { id: '0', name: 'lead' },
    { id: '1', name: 'top-rope' },
])
const saveSettings = () => {
    // Incorporate two data sources
    const payload = {...climber.value, ...settings.value}
    store.dispatch('saveSettings',payload)
        .then(ret => {
            toaster(ret.message)
        })
}
const isChecked = (field) => {
    const val = settings.value[field]
    return parseInt(val) == 1
}
const toggleTrueFalseWithNumber = (field, boolikka) => {
    if (boolikka) {
        settings.value[field] = 1
    } else {
        settings.value[field] = 0

    }
}

</script>