<template>
  <f7-page >
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">{{ t('global.back') }}</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.upcoming_competitions') }} </f7-nav-title>
    </f7-navbar>
    <div class="cl" data-test="comp-list">
      <div v-if="isError" class="p-banner p-banner--error cl-error" role="alert" data-test="comp-list-error">
        <span class="material-icons p-banner__icon" aria-hidden="true">error_outline</span>
        <div class="p-banner__content">{{ t('comps.load_failed') }}</div>
        <button type="button" class="p-btn p-btn--ghost p-btn--sm" @click="refetch()">{{ t('global.retry') }}</button>
      </div>

      <div v-else-if="isPlaceholderData" class="cl-loading" aria-busy="true" data-test="comp-list-loading">
        <span class="sr-only">{{ t('global.loading') }}</span>
        <div v-for="i in 3" :key="i" class="p-skeleton p-skeleton--card"></div>
      </div>

      <div v-else-if="items.length === 0" class="p-card cl-empty" data-test="comp-list-empty">
        <span class="material-icons cl-empty__icon" aria-hidden="true">emoji_events</span>
        <p class="cl-empty__title">{{ t('comps.no_upcoming') }}</p>
        <p class="cl-empty__text">{{ t('comps.no_upcoming_hint') }}</p>
        <a href="/competitions/past" class="p-btn p-btn--ghost p-btn--sm">{{ t('comps.past_competitions') }}</a>
      </div>

      <ul v-else class="cl-list">
        <li v-for="item in items" :key="item.comp.id">
          <a
            :href="item.link"
            class="cl-item"
            :class="item.standing ? 'cl-item--' + item.standing : null"
            data-test="comp-list-item"
          >
            <span class="cl-item__body">
              <span class="cl-item__name">{{ item.comp.name }}</span>
              <span class="cl-item__facts">
                <span class="cl-fact cl-fact--strong">
                  <i class="material-icons" aria-hidden="true">event</i>{{ toLocalTime(item.comp.compdate) }}
                </span>
                <span v-if="item.comp.location" class="cl-fact">
                  <i class="material-icons" aria-hidden="true">place</i>{{ item.comp.location }}
                </span>
              </span>

              <!-- Am I in it: the answer the list was opened for. -->
              <span v-if="item.standing" class="cl-standing" :class="'cl-standing--' + item.standing" data-test="comp-standing">
                <i class="material-icons" aria-hidden="true">{{ STANDINGS[item.standing].icon }}</i>{{ t(STANDINGS[item.standing].label) }}
              </span>

              <span v-if="item.registration === 'open'" class="cl-reg" data-test="comp-registration">
                <template v-if="hasBound(item.comp.registration_end)">
                  <span>{{ t('comps.registration_ends') }} {{ toLocalTime(item.comp.registration_end) }}</span>
                  <span class="cl-reg__soon">{{ dayjs.utc(item.comp.registration_end).fromNow() }}</span>
                </template>
                <template v-else>{{ t('comps.registration_is_open') }}</template>
              </span>
              <span v-else-if="item.registration === 'upcoming'" class="cl-reg" data-test="comp-registration">
                {{ t('comps.registration_opens') }} {{ toLocalTime(item.comp.registration_start) }}
              </span>
              <span v-else-if="item.registration === 'ended'" class="cl-reg" data-test="comp-registration">
                <span>{{ t('comps.registration_has_closed') }}</span>
                <span v-if="hasBound(item.comp.registration_end)">{{ toLocalTime(item.comp.registration_end) }}</span>
              </span>
            </span>
            <span class="material-icons cl-item__chevron" aria-hidden="true">chevron_right</span>
          </a>
        </li>
      </ul>
    </div>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onUnmounted, ref } from 'vue'
import dayjs from 'dayjs'
import { toLocalTime } from '../js/helpers/component.helpers'
import { hasBound } from '../js/helpers/compWindow'
import { compListing } from '../js/helpers/compListing'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
const { t } = useI18n()
const nowUTC = ref(dayjs().utc())
const clock = setInterval(() => nowUTC.value = dayjs().utc(),1000*30)
onUnmounted(() => clearInterval(clock))

dayjs.extend(relativeTime)

// Every standing gets its own icon as well as its own colour, so the two
// that matter most (in, and in but unpaid) do not rest on telling green
// from amber.
const STANDINGS = {
  registered: { icon: 'check_circle', label: 'comps.you_are_registered' },
  unpaid: { icon: 'error_outline', label: 'comps.you_are_registered_not_paid' },
  full: { icon: 'block', label: 'comps.full' },
  open: { icon: 'person_add', label: 'comps.not_registered' },
}

const getLink = (comp) => {
        return `/competitions/`+comp.id
}
// isPlaceholderData is what says "still finding out". The `loaded` flag
// cannot: select runs over the placeholder too and stamps it loaded.
const { data: comps, isError, isPlaceholderData, refetch } = useQuery({
  ...queries.competitions(),
  select: (data) => ({ upcoming: data.upcoming || [], ongoing: data.ongoing || [], past: data.past || [], loaded: true }),
  // placeholderData, not initialData: initialData is cached AS the answer, so
  // the empty list counted as a fresh, correct result and the query could
  // go without ever actually fetching — see queryKeys.js's gyms() for why.
  // placeholderData is only what to show while finding out.
  placeholderData: { upcoming: [], ongoing: [], past: [], loaded: false },
})
// Re-read every half minute (nowUTC), so a registration that closes while the
// list is open stops saying it is open.
const items = computed(() =>
  (comps.value?.upcoming ?? []).map((comp) => ({ comp, link: getLink(comp), ...compListing(comp, nowUTC.value) }))
)
</script>

<style scoped>
.cl {
  max-width: 42rem;
  margin: 0 auto;
  padding: 0.75rem 1rem 1rem;
}

.cl-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cl-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 0.5rem 0.875rem 1rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius-lg);
  background: var(--p-bg-card);
  color: inherit;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--p-duration) var(--p-ease), border-color var(--p-duration) var(--p-ease);
}
.cl-item:active {
  background: var(--p-bg-card-hover);
}
.cl-item:focus-visible {
  outline: 2px solid var(--p-accent);
  outline-offset: 2px;
}
/* The competitions I am in are findable by their edge before any reading. */
.cl-item--registered {
  border-color: rgba(59, 178, 115, 0.35);
}
.cl-item--unpaid {
  border-color: rgba(245, 158, 11, 0.35);
}

.cl-item__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
}
.cl-item__name {
  font-size: 1.0625rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--p-text);
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.cl-item__facts {
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}
.cl-fact {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  min-width: 0;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--p-text-muted);
}
.cl-fact .material-icons {
  flex-shrink: 0;
  font-size: 1rem;
  color: var(--p-text-dim);
}
.cl-fact--strong {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--p-text-secondary);
}

.cl-standing {
  display: inline-flex;
  align-items: flex-start;
  gap: 0.375rem;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.35;
}
.cl-standing .material-icons {
  flex-shrink: 0;
  font-size: 1.0625rem;
  line-height: 1.0625rem;
}
.cl-standing--registered {
  color: var(--p-success);
}
.cl-standing--unpaid {
  color: #fcd34d;
}
.cl-standing--unpaid .material-icons {
  color: var(--p-warning);
}
.cl-standing--full {
  color: var(--p-text-muted);
}
.cl-standing--open {
  color: var(--p-accent-tint);
}

.cl-reg {
  display: flex;
  flex-wrap: wrap;
  column-gap: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  color: var(--p-text-muted);
}
/* How long is left is the part to act on; it wraps as a whole. */
.cl-reg__soon {
  font-weight: 600;
  white-space: nowrap;
  color: var(--p-text-secondary);
}

.cl-item__chevron {
  flex-shrink: 0;
  font-size: 1.375rem;
  color: var(--p-text-dim);
}

.cl-loading {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.cl-error {
  align-items: center;
}
.cl-empty {
  margin: 0;
  padding: 1.75rem 1.125rem;
  text-align: center;
}
.cl-empty__icon {
  font-size: 2rem;
  color: var(--p-text-dim);
}
.cl-empty__title {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--p-text);
}
.cl-empty__text {
  max-width: 20rem;
  margin: 0.375rem auto 1rem;
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--p-text-muted);
}

@media (hover: hover) {
  .cl-item:hover {
    background: var(--p-bg-card-hover);
  }
}
@media (prefers-reduced-motion: reduce) {
  .cl-item {
    transition: none;
  }
}
</style>
