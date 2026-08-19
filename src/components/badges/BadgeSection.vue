<template>
  <div v-if="hasAnything" class="badges">
    <div class="badges__head">
      <h3 class="badges__title">{{ t('badges.title') }}</h3>
      <div class="badges__meta">
        <!-- Shown even at zero: "0/7" says there are seven things to chase,
             which is the entire point of showing an empty cabinet. -->
        <span class="badges__count num">{{ earnedList.length }}/{{ allBadges.length }}</span>
        <button type="button" class="badges__all" @click="openAll">
          {{ t('badges.show_all') }}
        </button>
      </div>
    </div>

    <!-- Earned first, then what is still out there. A climber should be able
         to see their own haul without scrolling, and still discover the rest
         by pushing the row along. -->
    <div class="badges__row">
      <badge-medal
        v-for="b in visible"
        :key="b.id"
        :badge="b"
        :earned="earnedIds.has(b.id)"
        @open="open"
      />
    </div>

    <badge-detail-sheet v-model:opened="sheetOpen" :badge="selected" :earned-at="earnedAt" />
  </div>
</template>

<script setup>
/**
 * The badge shelf on the home screen.
 *
 * The API answers with two lists — every badge the gym defines, and the ones
 * this climber has earned — so the section can show progress rather than only
 * a trophy cabinet. An empty cabinet with six things to chase is more use
 * than an empty section.
 */
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import BadgeMedal from './BadgeMedal.vue'
import BadgeDetailSheet from './BadgeDetailSheet.vue'
import { f7 } from 'framework7-vue'

const COLLAPSED_COUNT = 8

const { t } = useI18n()
const store = useStore()

const selected = ref(null)
const sheetOpen = ref(false)

const badges = computed(() => store.state.badges)
const gymid = computed(() => store.state.gymid)

// The earned rows carry badge_id (the definition), not their own id.
const earnedList = computed(() => badges.value.earned ?? [])
const earnedIds = computed(() => new Set(earnedList.value.map((e) => e.badge_id)))

// Earned first, then the rest — both already in the gym's sort order.
const allBadges = computed(() => {
  const defs = badges.value.definitions ?? []
  return [
    ...defs.filter((d) => earnedIds.value.has(d.id)),
    ...defs.filter((d) => !earnedIds.value.has(d.id))
  ]
})

const visible = computed(() => allBadges.value.slice(0, COLLAPSED_COUNT))
const hasAnything = computed(() => allBadges.value.length > 0)

const earnedAt = computed(() => {
  if (!selected.value) return null
  const row = earnedList.value.find((e) => e.badge_id === selected.value.id)
  return row?.earned_at ? dayjs(row.earned_at).format('YYYY-MM-DD') : null
})



function openAll() {
  f7?.views?.main?.router?.navigate('/badges')
}

function open(badge) {
  selected.value = badge
  sheetOpen.value = true
}

// Badges belong to a gym, so switching gym reloads them. The action itself
// skips the request when the gym has not changed.
watch(gymid, (id) => id && store.dispatch('loadBadges', id), { immediate: true })
</script>

<style scoped>
.badges {
  margin: 0 16px 1rem;
}

.badges__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.badges__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.badges__meta {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.badges__all {
  padding: 0;
  border: none;
  background: none;
  color: var(--p-accent);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.badges__count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-dim);
}

.badges__row {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  /* The row scrolls rather than wrapping: a wrapped grid of mostly-locked
     badges dominates the home screen, and this is a sidebar of the climbing,
     not the point of it. */
  scrollbar-width: none;
  padding-bottom: 2px;
}

.badges__row::-webkit-scrollbar {
  display: none;
}


/* ─── Detail sheet ─── */
.badge-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.75rem 1.5rem 2.25rem;
  text-align: center;
}

.badge-detail__ring {
  width: 88px;
  height: 88px;
  background: var(--p-bg-card);
  border-color: var(--p-border-light);
}

.badge-detail__icon {
  font-size: 42px;
  color: var(--p-text-dark);
}

.badge-detail__name {
  margin: 0.35rem 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--p-text);
}

.badge-detail__desc {
  margin: 0;
  max-width: 30ch;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--p-text-muted);
}

.badge-detail__earned {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--p-success);
}

.badge-detail__locked {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  color: var(--p-text-dim);
}
</style>
