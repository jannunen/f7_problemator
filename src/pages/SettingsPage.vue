<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link  back>&lt;
                    <f7-icon md="material:home" aurora="f7:home" ios="f7:home" />
                </f7-link>
            </f7-nav-left>
            <f7-nav-title> {{ t('settings.settings_title') }} </f7-nav-title>
        </f7-navbar>
        <f7-block v-if="climber != null">
            <f7-block strong>
                <p>
                    Here are your personal settings. You can toggle some visibility items
                    and some convenience settings.
                </p>
            </f7-block>
            <f7-list >
                <f7-block-title>Personal details (optional)</f7-block-title>
                <f7-list-input label="First name" type="text" placeholder="Your first name" v-model:value="climber.etunimi" clear-button> </f7-list-input>
                <f7-list-input label="Last name" type="text" placeholder="Your last name" v-model:value="climber.sukunimi" clear-button> </f7-list-input>
                <f7-list-input label="Email (read only)" type="text" readonly :value="climber.email"> </f7-list-input>
                <f7-list-input type="datepicker" 
                  dateFormat="yyyy-mm-dd"
                  formatValue="yyyy-mm-dd"
                 :value="[climber.birthday]"
                  @calendar:change="(value) => setBirthDay(value)"
                />
                <f7-list-input label="Team" placeholder="Enter team" type="text" v-model:value="climber.team"> </f7-list-input>
                <f7-list-input label="Gender" type="select" v-model:value="climber.gender" placeholder="Please choose...">
                    <option v-for="gender in genders" :value="gender.id" :key="gender.id">{{ gender.name }}</option>
                </f7-list-input>
                <f7-list-item>
                <select type="select" label="Country" v-model="climber.maa">
                    <option v-for="country in getNames()" :value="country" :key="country">{{ country }}</option>
                </select>
                </f7-list-item>
            </f7-list>
                <p class="text-red-500 font-bold uppercase">Please note that the info below will be shown on your public profile page. If you don't like them to
                show, please leave these fields empty!</p>
            <f7-list>
                
                
                <f7-list-input label="Height" type="text" placeholder="in cm" v-model:value="climber.height"> </f7-list-input>
                <f7-list-input label="Ape index" placeholder="eg. +9" type="text" v-model:value="climber.apeindex"> </f7-list-input>
                <f7-list-input label="City" placeholder="Enter city" type="text" v-model:value="climber.city"> </f7-list-input>
                <f7-list-input label="Bio" type="textarea" v-model:value="climber.bio" resizable placeholder="Bio"> </f7-list-input>
                </f7-list>

                <p>Enter your social media links here. If you don't have one, leave the field empty.</p>
                <f7-list>
                <f7-list-input label="27 Crags"  type="text" v-model:value="climber.social_27crags"> </f7-list-input>
                <f7-list-input label="Twitter"  type="text" v-model:value="climber.social_twitter"> </f7-list-input>
                <f7-list-input label="Instagram"  type="text" v-model:value="climber.social_ig"> </f7-list-input>
                <f7-list-input label="Tiktok"  type="text" v-model:value="climber.social_tiktok"> </f7-list-input>
                <f7-list-input label="Facebook"  type="text" v-model:value="climber.social_fb"> </f7-list-input>
                <f7-list-input label="Snapchat"  type="text" v-model:value="climber.social_snapchat"> </f7-list-input>
                </f7-list>


                <f7-list>

                <f7-block-title>Default ascent type</f7-block-title>
                <f7-list-input label="Affects only sport climbing" type="select" v-model:value="climber.sport_tick_ascent_type" placeholder="Please choose...">
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
import { onMounted, watch,  ref,  computed } from 'vue'
import { useStore } from 'vuex'
import { toaster, alert } from '@js/helpers/notifications.js'
import { getNames } from 'country-list'
import dayjs from 'dayjs'
const store = useStore()
const { t } = useI18n()
const props = defineProps({
    f7router: Object,
})
const climberStore = computed(() => store.state.climber)
const climber = ref(null)

watch(climberStore, (newValue) => {
    climber.value = JSON.parse(JSON.stringify(newValue))
})
onMounted(() => {
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
    let payload = {...climber.value}
  if (Array.isArray(payload.birthday)) {
    payload.birthday = payload.birthday[0]
  }
    store.dispatch('saveSettings',payload)
        .then(ret => {
            toaster(ret.message)
        })
}
const setBirthDay = (value) => {
    if (value.length == 1) {
      climber.value.birthday = dayjs(value[0]).format('YYYY-MM-DD')
    }
}
const isChecked = (field) => {
    const val = climber.value[field]
    return parseInt(val) == 1
}
const toggleTrueFalseWithNumber = (field, boolikka) => {
    if (boolikka) {
        climber.value[field] = 1
    } else {
        climber.value[field] = 0
    }
}

</script>
