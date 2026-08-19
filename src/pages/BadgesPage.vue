<template>
  <f7-page name="badges">
    <f7-navbar :title="t('badges.title')" back-link>
      <template #right>
        <span class="badges-page__count num">{{ earned.length }}/{{ ladders.length }}</span>
      </template>
    </f7-navbar>

    <p v-if="!allBadges.length" class="badges-page__empty">{{ t('badges.none_defined') }}</p>

    <template v-else>
      <!-- Split rather than sorted: "what I have" and "what is left" are two
           different questions, and a single run of medals answers neither
           well. Each section only appears when it has something in it. -->
      <template v-if="earned.length">
        <h2 class="badges-page__section">{{ t('badges.earned') }}</h2>
        <div class="badges-page__grid">
          <badge-medal v-for="b in earned" :key="b.id" :badge="b" earned @open="open" />
        </div>
      </template>

      <template v-if="locked.length">
        <h2 class="badges-page__section">{{ t('badges.locked') }}</h2>
        <div class="badges-page__grid">
          <badge-medal v-for="b in locked" :key="b.id" :badge="b" @open="open" />
        </div>
      </template>
    </template>

    <badge-detail-sheet v-model:opened="sheetOpen" :badge="selected" :earned-at="earnedAt" :level="selectedLevel" />
  </f7-page>
</template>

<script setup>
/**
 * Every badge the gym defines, earned and not.
 *
 * The home screen carries a single scrolling row because it is a sidebar to
 * the climbing; this is the page you come to when you actually want to read
 * them, so it wraps and gives each one room.
 */
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import BadgeMedal from '@components/badges/BadgeMedal.vue'
import BadgeDetailSheet from '@components/badges/BadgeDetailSheet.vue'
import { groupTiers } from '@helpers/badgeTiers.js'

const { t } = useI18n()
const store = useStore()

const selected = ref(null)
const sheetOpen = ref(false)

const badges = computed(() => store.state.badges)
const gymid = computed(() => store.state.gymid)

const earnedList = computed(() => badges.value.earned ?? [])
const earnedIds = computed(() => new Set(earnedList.value.map((e) => e.badge_id)))
const allBadges = computed(() => badges.value.definitions ?? [])

// Ladders rather than rungs. A group shows at most twice: the highest level
// reached under Earned, and the next one to reach under Not yet. Every rung
// in between is a level of the same award and only crowds the page.
const ladders = computed(() => groupTiers(allBadges.value, earnedIds.value))

const earned = computed(() => ladders.value.map((g) => g.current).filter(Boolean))
const locked = computed(() => ladders.value.map((g) => g.next).filter(Boolean))

// "Level 3 of 14" in the sheet, so the ladder above and below is discoverable
// even though only one rung is on screen.
const selectedLevel = computed(() => {
  if (!selected.value) return null
  const group = ladders.value.find((g) => g.rungs.some((r) => r.id === selected.value.id))
  if (!group || group.total < 2) return null
  return { level: group.levelOf(selected.value), total: group.total }
})

const earnedAt = computed(() => {
  if (!selected.value) return null
  const row = earnedList.value.find((e) => e.badge_id === selected.value.id)
  return row?.earned_at ? dayjs(row.earned_at).format('YYYY-MM-DD') : null
})

function open(badge) {
  selected.value = badge
  sheetOpen.value = true
}

// Deep-linkable: this page must stand on its own if it is opened first.
watch(gymid, (id) => id && store.dispatch('loadBadges', id), { immediate: true })
</script>

<style scoped>
.badges-page__count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-dim);
}

.badges-page__empty {
  margin: 2rem 1rem;
  text-align: center;
  color: var(--p-text-dim);
}

.badges-page__section {
  margin: 1.25rem 1rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.badges-page__grid {
  display: grid;
  /* auto-fill rather than a fixed column count: four across on a phone,
     more on a tablet, without a breakpoint for each. */
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 1.25rem 0.5rem;
  padding: 0 1rem;
}

/* The medal is sized for the home row; in the grid the cell decides. */
.badges-page__grid :deep(.medal) {
  width: auto;
}
</style>
