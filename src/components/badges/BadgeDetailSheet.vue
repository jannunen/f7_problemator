<template>
  <f7-sheet :opened="opened" style="height: auto" close-by-outside-click swipe-to-close
            @sheet:closed="$emit('update:opened', false)">
    <div v-if="badge" class="badge-detail">
      <span class="p-ring badge-detail__ring" :style="ringStyle">
        <span class="material-icons badge-detail__icon" :style="iconStyle">
          {{ badge.icon || 'military_tech' }}
        </span>
      </span>
      <h2 class="badge-detail__name">{{ badge.name }}</h2>
      <p v-if="badge.description" class="badge-detail__desc">{{ badge.description }}</p>
      <p v-if="level" class="badge-detail__level">
        {{ t('badges.level_of', { level: level.level, total: level.total }) }}
      </p>

      <!-- The whole ladder, because only one rung is ever on screen and
           "level 3 of 9" does not say what 4 asks for or what 2 was. -->
      <ol v-if="levels.length > 1" class="ladder">
        <li
          v-for="rung in levels"
          :key="rung.id"
          class="ladder__rung"
          :class="{
            'ladder__rung--earned': rung.earned,
            'ladder__rung--current': rung.id === badge?.id
          }"
        >
          <span class="ladder__mark material-icons">
            {{ rung.earned ? 'check_circle' : 'radio_button_unchecked' }}
          </span>
          <span class="ladder__name">{{ rung.name }}</span>
        </li>
      </ol>
      <p v-if="earnedAt" class="badge-detail__earned">{{ t('badges.earned_on', { date: earnedAt }) }}</p>
      <p v-else class="badge-detail__locked">{{ t('badges.not_earned') }}</p>
    </div>
  </f7-sheet>
</template>

<script setup>
/**
 * What a badge is and whether you have it.
 *
 * Extracted so the home-screen shelf and the full grid open the same thing —
 * two copies would drift, and this is the only place a badge's rule is
 * spelled out in words.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  opened: { type: Boolean, default: false },
  badge: { type: Object, default: null },
  earnedAt: { type: String, default: null },
  // { level, total } when this badge is one rung of a ladder — the page shows
  // only one rung, so this is how the rest of the ladder stays discoverable.
  level: { type: Object, default: null },
  // Every rung of this badge's ladder, earned flag included. Empty or a
  // single entry for a badge that has no levels.
  levels: { type: Array, default: () => [] }
})

defineEmits(['update:opened'])

const { t } = useI18n()

const rgb = computed(() => {
  const hex = String(props.badge?.color || '').replace('#', '')
  if (hex.length !== 6) return null
  const n = parseInt(hex, 16)
  return Number.isNaN(n) ? null : `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
})

// Colour is the reward: an unearned badge is shown in outline only.
const ringStyle = computed(() =>
  props.earnedAt && rgb.value
    ? { background: `rgba(${rgb.value}, 0.12)`, borderColor: `rgba(${rgb.value}, 0.45)` }
    : {}
)
const iconStyle = computed(() =>
  props.earnedAt && props.badge?.color ? { color: props.badge.color } : {}
)
</script>

<style scoped>
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

.badge-detail__level {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-dim);
}

/* Compact enough that a fourteen rung ladder does not push the date off
   the bottom of the sheet, and scrollable when it does. */
.ladder {
  width: 100%;
  max-width: 18rem;
  max-height: 11rem;
  overflow-y: auto;
  margin: 0.9rem 0 0.2rem;
  padding: 0;
  list-style: none;
  text-align: left;
}

.ladder__rung {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.25rem 0.4rem;
  border-radius: var(--p-radius-sm);
  font-size: 0.78rem;
  color: var(--p-text-dark);
}

.ladder__rung--earned {
  color: var(--p-text-secondary);
}

/* The one being explained, so the list has a "you are here". */
.ladder__rung--current {
  background: rgba(var(--p-accent-rgb), 0.1);
  color: var(--p-text);
  font-weight: 600;
}

.ladder__mark {
  font-size: 15px;
  flex: none;
  color: var(--p-text-dark);
}

.ladder__rung--earned .ladder__mark {
  color: var(--p-success);
}

.ladder__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
