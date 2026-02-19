<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link back>&lt;
                    <f7-icon md="material:home" aurora="f7:home" ios="f7:home" />
                </f7-link>
            </f7-nav-left>
            <f7-nav-title>{{ t('settings.settings_title') }}</f7-nav-title>
        </f7-navbar>

        <div v-if="climber != null" class="pb-8">

            <!-- Intro -->
            <div class="px-4 pt-3 pb-1">
                <p class="text-sm p-text-muted leading-relaxed">{{ t('settings.intro') }}</p>
            </div>

            <!-- Personal details -->
            <div class="p-card">
                <div class="settings-section-header">
                    <span class="material-icons settings-section-icon">person</span>
                    <div class="p-card__title mb-0">{{ t('settings.personal_details') }}</div>
                </div>

                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.first_name') }}</label>
                    <input class="p-input" type="text" :placeholder="t('settings.your_first_name')" v-model="climber.etunimi" />
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.last_name') }}</label>
                    <input class="p-input" type="text" :placeholder="t('settings.your_last_name')" v-model="climber.sukunimi" />
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.email_readonly') }}</label>
                    <input class="p-input settings-input--readonly" type="text" readonly :value="climber.email" />
                </div>
                <div class="settings-field">
                    <label class="settings-label">Birthday</label>
                    <f7-list class="settings-f7-list">
                        <f7-list-input type="datepicker"
                            dateFormat="yyyy-mm-dd"
                            formatValue="yyyy-mm-dd"
                            :value="[climber.birthday]"
                            @calendar:change="(value) => setBirthDay(value)"
                        />
                    </f7-list>
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.team') }}</label>
                    <input class="p-input" type="text" :placeholder="t('settings.enter_team')" v-model="climber.team" />
                </div>
                <div class="settings-row">
                    <div class="settings-field flex-1">
                        <label class="settings-label">{{ t('settings.gender') }}</label>
                        <select class="p-select" v-model="climber.gender">
                            <option value="" disabled>{{ t('settings.please_choose') }}</option>
                            <option v-for="gender in genders" :value="gender.id" :key="gender.id">{{ gender.name }}</option>
                        </select>
                    </div>
                    <div class="settings-field flex-1">
                        <label class="settings-label">{{ t('settings.country') }}</label>
                        <select class="p-select" v-model="climber.maa">
                            <option v-for="country in getNames()" :value="country" :key="country">{{ country }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Public profile -->
            <div class="p-card">
                <div class="settings-section-header">
                    <span class="material-icons settings-section-icon">public</span>
                    <div class="p-card__title mb-0">Profile</div>
                </div>
                <div class="p-banner p-banner--warning mb-3">
                    <span class="material-icons p-banner__icon">visibility</span>
                    <div class="p-banner__content">{{ t('settings.public_profile_warning') }}</div>
                </div>

                <div class="settings-row">
                    <div class="settings-field flex-1">
                        <label class="settings-label">{{ t('settings.height') }}</label>
                        <input class="p-input" type="text" :placeholder="t('settings.height_placeholder')" v-model="climber.height" />
                    </div>
                    <div class="settings-field flex-1">
                        <label class="settings-label">{{ t('settings.ape_index') }}</label>
                        <input class="p-input" type="text" :placeholder="t('settings.ape_index_placeholder')" v-model="climber.apeindex" />
                    </div>
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.city') }}</label>
                    <input class="p-input" type="text" :placeholder="t('settings.enter_city')" v-model="climber.city" />
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.bio') }}</label>
                    <textarea class="p-input settings-textarea" :placeholder="t('settings.bio')" v-model="climber.bio"></textarea>
                </div>
            </div>

            <!-- Social media -->
            <div class="p-card">
                <div class="settings-section-header">
                    <span class="material-icons settings-section-icon">share</span>
                    <div class="p-card__title mb-0">Social</div>
                </div>
                <p class="text-xs p-text-muted mb-3">{{ t('settings.social_media_intro') }}</p>

                <div class="settings-row">
                    <div class="settings-field flex-1">
                        <label class="settings-label">27 Crags</label>
                        <input class="p-input" type="text" v-model="climber.social_27crags" />
                    </div>
                    <div class="settings-field flex-1">
                        <label class="settings-label">Instagram</label>
                        <input class="p-input" type="text" v-model="climber.social_ig" />
                    </div>
                </div>
                <div class="settings-row">
                    <div class="settings-field flex-1">
                        <label class="settings-label">Tiktok</label>
                        <input class="p-input" type="text" v-model="climber.social_tiktok" />
                    </div>
                    <div class="settings-field flex-1">
                        <label class="settings-label">Facebook</label>
                        <input class="p-input" type="text" v-model="climber.social_fb" />
                    </div>
                </div>
                <div class="settings-row">
                    <div class="settings-field flex-1">
                        <label class="settings-label">Twitter</label>
                        <input class="p-input" type="text" v-model="climber.social_twitter" />
                    </div>
                    <div class="settings-field flex-1">
                        <label class="settings-label">Snapchat</label>
                        <input class="p-input" type="text" v-model="climber.social_snapchat" />
                    </div>
                </div>
            </div>

            <!-- Preferences -->
            <div class="p-card">
                <div class="settings-section-header">
                    <span class="material-icons settings-section-icon">tune</span>
                    <div class="p-card__title mb-0">{{ t('settings.default_ascent_type') }}</div>
                </div>
                <div class="settings-field">
                    <label class="settings-label">{{ t('settings.affects_sport_only') }}</label>
                    <select class="p-select" v-model="climber.sport_tick_ascent_type">
                        <option value="" disabled>{{ t('settings.please_choose') }}</option>
                        <option v-for="ascentType in ascentTypes" :value="ascentType.id" :key="ascentType.id">{{ ascentType.name }}</option>
                    </select>
                </div>
            </div>

            <!-- Visibility -->
            <div class="p-card">
                <div class="settings-section-header">
                    <span class="material-icons settings-section-icon">visibility</span>
                    <div class="p-card__title mb-0">{{ t('settings.visibility') }}</div>
                </div>

                <div class="settings-toggle-row">
                    <span class="text-sm">{{ t('settings.ranking_visibility') }}</span>
                    <f7-toggle @toggle:change="(val) => toggleTrueFalseWithNumber('showinranking',val)" :checked="isChecked('showinranking')"></f7-toggle>
                </div>
                <div class="settings-toggle-row" style="border-bottom: none;">
                    <span class="text-sm">{{ t('settings.show_ascents') }}</span>
                    <f7-toggle @toggle:change="(val) => toggleTrueFalseWithNumber('publicascents',val)" :checked="isChecked('publicascents')"></f7-toggle>
                </div>
            </div>

            <!-- Save -->
            <div class="px-4 mt-1">
                <button class="p-btn p-btn--primary p-btn--block" @click="saveSettings">
                    <span class="material-icons" style="font-size: 18px;">save</span>
                    {{ t('settings.save') }}
                </button>
            </div>

        </div>
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

const genders = computed(() => [
    { id: 'm', name: t('settings.male') },
    { id: 'f', name: t('settings.female') },
    { id: 'unset', name: t('settings.prefer_not_to_say') },
])
const ascentTypes = computed(() => [
    { id: '0', name: t('settings.lead') },
    { id: '1', name: t('settings.top_rope') },
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
<style scoped>
.settings-section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.settings-section-icon {
    font-size: 20px;
    color: var(--p-text-dim);
}

.settings-field {
    margin-bottom: 0.75rem;
}

.settings-field:last-child {
    margin-bottom: 0;
}

.settings-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--p-text-muted);
    margin-bottom: 0.375rem;
}

.settings-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.settings-row:last-child {
    margin-bottom: 0;
}

.settings-input--readonly {
    opacity: 0.5;
    cursor: not-allowed;
}

.settings-textarea {
    min-height: 5rem;
    resize: vertical;
}

.settings-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--p-border);
    color: var(--p-text);
}

/* Reset f7-list styles when embedded inside p-card */
.settings-f7-list {
    margin: 0;
    padding: 0;
}

.settings-f7-list :deep(.list) {
    margin: 0;
}

.settings-f7-list :deep(ul) {
    background: transparent;
    padding: 0;
}

.settings-f7-list :deep(.item-input-wrap input) {
    color: var(--p-text);
}
</style>
