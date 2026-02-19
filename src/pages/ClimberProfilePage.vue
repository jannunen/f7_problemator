<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left back-link="Back"></f7-nav-left>
      <f7-nav-title>{{ t('profile.climber_profile') }}</f7-nav-title>
    </f7-navbar>

    <div v-if="loading" class="profile-loading">
      <div class="p-spinner"></div>
    </div>

    <div v-if="profile != null" class="profile-page">
      <!-- Hero header -->
      <div class="profile-hero">
        <div class="profile-hero__gradient"></div>
        <div class="profile-hero__content">
          <div class="profile-avatar">
            <span class="material-icons profile-avatar__icon">person</span>
          </div>
          <h1 class="profile-name">{{ profile.etunimi }} {{ profile.sukunimi }}</h1>
          <p v-if="profile.city" class="profile-location">
            <span class="material-icons" style="font-size: 14px; vertical-align: -2px;">location_on</span>
            {{ profile.city }}
          </p>
          <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="profile-stats">
        <div class="profile-stats__item">
          <span class="profile-stats__value">{{ profile.total_ascents || 0 }}</span>
          <span class="profile-stats__label">{{ t('climber_profile.ascents') }}</span>
        </div>
        <div class="profile-stats__divider"></div>
        <div class="profile-stats__item">
          <span class="profile-stats__value">{{ formatGrade(profile.boulder_hardest?.name) || '—' }}</span>
          <span class="profile-stats__label">{{ t('climber_profile.hardest_boulder') }}</span>
        </div>
        <div class="profile-stats__divider"></div>
        <div class="profile-stats__item">
          <span class="profile-stats__value">{{ profile.sport_hardest?.name || '—' }}</span>
          <span class="profile-stats__label">{{ t('climber_profile.hardest_sport') }}</span>
        </div>
      </div>

      <!-- Follow bar -->
      <div class="profile-follow-bar">
        <div class="profile-follow-bar__stat">
          <span class="profile-follow-bar__count">{{ profile.following?.length ?? 0 }}</span>
          <span class="profile-follow-bar__label">{{ t('climber_profile.following') }}</span>
        </div>
        <div class="profile-follow-bar__stat">
          <span class="profile-follow-bar__count">{{ profile.followers?.length ?? 0 }}</span>
          <span class="profile-follow-bar__label">{{ t('climber_profile.followers') }}</span>
        </div>
        <div class="profile-follow-bar__action">
          <template v-if="climber?.id != profile.id">
            <button v-if="amIFollowing" class="p-btn p-btn--ghost p-btn--sm" @click.prevent="followUnFollow(profile.id)">{{ t('climber_profile.unfollow') }}</button>
            <button v-else class="p-btn p-btn--primary p-btn--sm" @click.prevent="followUnFollow(profile.id)">{{ t('climber_profile.follow') }}</button>
          </template>
          <span v-else class="profile-follow-bar__you">{{ t('climber_profile.this_is_you') }}</span>
        </div>
      </div>

      <!-- Top 10 card -->
      <div class="p-card" v-if="profile.boulder_top10_alltime || profile.sport_top10_alltime">
        <div class="p-section-title" style="margin-top: 0;">{{ t('climber_profile.top10_average') }}</div>
        <div class="profile-top10">
          <div class="profile-top10__item" v-if="profile.boulder_top10_alltime">
            <span class="profile-top10__grade">{{ estimateGrade(profile.boulder_top10_alltime, grades).toUpperCase() }}</span>
            <span class="profile-top10__type">{{ t('climber_profile.boulder') }}</span>
            <span class="profile-top10__score">{{ profile.boulder_top10_alltime }} pts</span>
          </div>
          <div class="profile-top10__item" v-if="profile.sport_top10_alltime">
            <span class="profile-top10__grade">{{ estimateGrade(profile.sport_top10_alltime, grades) }}</span>
            <span class="profile-top10__type">{{ t('climber_profile.sport') }}</span>
            <span class="profile-top10__score">{{ profile.sport_top10_alltime }} pts</span>
          </div>
        </div>
      </div>

      <!-- Body specs card -->
      <div class="p-card" v-if="profile.height || profile.apeindex || profile.age">
        <div class="p-section-title" style="margin-top: 0;">{{ t('climber_profile.specs') }}</div>
        <div class="profile-specs">
          <div class="profile-specs__item" v-if="profile.height">
            <span class="material-icons profile-specs__icon">straighten</span>
            <span class="profile-specs__label">{{ t('climber_profile.height') }}</span>
            <span class="profile-specs__value">{{ profile.height }} cm</span>
          </div>
          <div class="profile-specs__item" v-if="profile.apeindex">
            <span class="material-icons profile-specs__icon">open_with</span>
            <span class="profile-specs__label">{{ t('climber_profile.ape_index') }}</span>
            <span class="profile-specs__value">{{ profile.apeindex }} cm</span>
          </div>
          <div class="profile-specs__item" v-if="profile.age">
            <span class="material-icons profile-specs__icon">cake</span>
            <span class="profile-specs__label">{{ t('climber_profile.age') }}</span>
            <span class="profile-specs__value">{{ profile.age }}</span>
          </div>
          <div class="profile-specs__item" v-if="profile.added">
            <span class="material-icons profile-specs__icon">calendar_today</span>
            <span class="profile-specs__label">{{ t('climber_profile.joined') }}</span>
            <span class="profile-specs__value">{{ dayjs(profile.added).format("YYYY-MM-DD") }}</span>
          </div>
        </div>
      </div>

      <!-- Social links -->
      <div class="p-card" v-if="hasSocials">
        <div class="p-section-title" style="margin-top: 0;">{{ t('climber_profile.social') }}</div>
        <social-buttons :profile="profile" />
      </div>

      <!-- Badges -->
      <climber-badges />

      <!-- Settings hint -->
      <div class="profile-hint">
        <span class="material-icons profile-hint__icon">info</span>
        <span>{{ t('climber_profile.settings_hint') }} <a class="p-link" href="#" @click.prevent="openSettings">{{ t('climber_profile.settings_link') }}</a>. {{ t('climber_profile.settings_hint2') }}</span>
      </div>

      <!-- Latest ascents -->
      <div class="profile-ascents" v-if="profile.latest_ascents && profile.latest_ascents.length > 0">
        <div class="p-section-title" style="margin: 0.75rem 1rem 0.375rem;">{{ t('climber_profile.latest_ascents') }}</div>
        <f7-list media class="my-0">
          <climbed-problem-list-item
            v-for="problem in profile.latest_ascents"
            :key="problem.id"
            :problem="problem"
            @click="() => onStartNavigate(problem)"
          />
        </f7-list>
      </div>
      <div v-else class="p-card" style="text-align: center;">
        <span class="p-text-muted">{{ t('climber_profile.no_ascents_yet') }}</span>
      </div>
    </div>
  </f7-page>
</template>

<script setup>
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { estimateGrade } from '@js/helpers'
import dayjs from 'dayjs'
import ClimbedProblemListItem from '@components/profile/ClimbedProblemListItem.vue'
import SocialButtons from '@components/profile/SocialButtons.vue'
import ClimberBadges from '@components/profile/ClimberBadges.vue'

const { t } = useI18n()
const store = useStore()
const props = defineProps({
  id: Number,
})

const profile = computed(() => store.state.climbers.profile)
const climber = computed(() => store.state.climber)
const grades = computed(() => store.state.grades)
const loading = ref(true)

store.dispatch('climbers/profile', props.id).then(() => {
  loading.value = false
})

const amIFollowing = computed(() => {
  if (!climber.value || !profile.value?.followers) return false
  return profile.value.followers.find(x => x.follow_from == climber.value.id)
})

const followUnFollow = (id) => {
  store.dispatch('climbers/followUnFollow', id)
}

const hasSocials = computed(() => {
  if (!profile.value) return false
  const p = profile.value
  return [p.social_ig, p.social_twitter, p.social_fb, p.social_tiktok, p.social_snapchat, p.social_27crags]
    .some(v => v != null && v !== '')
})

const formatGrade = (name) => {
  if (!name) return null
  return name.toUpperCase()
}

const openSettings = () => {
  store.commit('setSelectedLeftPanelItem', 'settings')
  store.commit('setSidePanel', false)
  f7.views.main.router.navigate("/settings")
}

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem },
  })
}
</script>

<style scoped>
.profile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.profile-page {
  padding-bottom: 2rem;
}

/* Hero */
.profile-hero {
  position: relative;
  padding: 2.5rem 1.5rem 1.5rem;
  text-align: center;
  overflow: hidden;
}
.profile-hero__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(56, 189, 248, 0.15) 0%, rgba(167, 139, 250, 0.1) 50%, transparent 100%);
  pointer-events: none;
}
.profile-hero__content {
  position: relative;
  z-index: 1;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(var(--p-accent-rgb), 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}
.profile-avatar__icon {
  font-size: 36px;
  color: var(--p-text-dim);
}

.profile-name {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-text);
  margin: 0;
  line-height: 1.2;
}
.profile-location {
  font-size: 0.8rem;
  color: var(--p-text-muted);
  margin: 0.25rem 0 0;
}
.profile-bio {
  font-size: 0.85rem;
  color: var(--p-text-secondary);
  margin: 0.625rem auto 0;
  max-width: 300px;
  line-height: 1.45;
  font-style: italic;
}

/* Stats row */
.profile-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin: 0 1rem;
  padding: 0.875rem 0;
  border-top: 1px solid var(--p-border);
  border-bottom: 1px solid var(--p-border);
}
.profile-stats__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}
.profile-stats__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--p-text);
  line-height: 1.1;
}
.profile-stats__label {
  font-size: 0.65rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--p-text-dim);
}
.profile-stats__divider {
  width: 1px;
  height: 28px;
  background: var(--p-border);
  flex-shrink: 0;
}

/* Follow bar */
.profile-follow-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.75rem 1.25rem;
  margin: 0.75rem 1rem 0;
  background: var(--p-bg-card);
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
}
.profile-follow-bar__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.profile-follow-bar__count {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--p-text);
  line-height: 1;
}
.profile-follow-bar__label {
  font-size: 0.7rem;
  color: var(--p-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 0.125rem;
}
.profile-follow-bar__action {
  margin-left: auto;
}
.profile-follow-bar__you {
  font-size: 0.8rem;
  color: var(--p-text-muted);
  font-weight: 500;
}

/* Top 10 */
.profile-top10 {
  display: flex;
  gap: 1rem;
}
.profile-top10__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--p-radius-sm);
  background: rgba(255, 255, 255, 0.03);
}
.profile-top10__grade {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--p-accent);
  line-height: 1.1;
}
.profile-top10__type {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--p-text-muted);
  margin-top: 0.125rem;
}
.profile-top10__score {
  font-size: 0.75rem;
  color: var(--p-text-dim);
  margin-top: 0.125rem;
}

/* Specs */
.profile-specs {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.profile-specs__item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--p-border);
}
.profile-specs__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.profile-specs__item:first-child {
  padding-top: 0;
}
.profile-specs__icon {
  font-size: 18px;
  color: var(--p-text-dim);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}
.profile-specs__label {
  flex: 1;
  font-size: 0.85rem;
  color: var(--p-text-muted);
}
.profile-specs__value {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--p-text);
}

/* Hint */
.profile-hint {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.75rem 1rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--p-radius-sm);
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.12);
  font-size: 0.8rem;
  color: var(--p-text-muted);
  line-height: 1.4;
}
.profile-hint__icon {
  font-size: 16px;
  color: var(--p-warning);
  flex-shrink: 0;
  margin-top: 1px;
}
</style>
