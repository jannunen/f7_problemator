<template>
  <button type="button" class="medal" :class="{ 'medal--locked': !earned }" @click="$emit('open', badge)">
    <span class="p-ring medal__ring" :style="ringStyle">
      <span class="material-icons medal__icon" :style="iconStyle">{{ badge.icon || 'military_tech' }}</span>
    </span>
    <span class="medal__name">{{ badge.name }}</span>
  </button>
</template>

<script setup>
/**
 * One badge, earned or not.
 *
 * Each badge definition carries its own colour, so the ring is tinted with it
 * rather than with the app accent — that is the whole point of a badge, that
 * it is distinguishable at a glance. The shape, the wash-plus-hairline and
 * the weights all come from the shared design language, so a wall of these
 * still reads as one family.
 *
 * A locked badge keeps its silhouette but loses its colour. It is shown, not
 * hidden: knowing what is available is most of what makes it worth chasing.
 */
import { computed } from 'vue'

const props = defineProps({
  badge: { type: Object, required: true },
  earned: { type: Boolean, default: false }
})

defineEmits(['open'])

// The colour arrives as a hex string from the gym's badge definition. It is
// data, not a token, so it cannot live in CSS — but everything around it can.
const rgb = computed(() => {
  const hex = String(props.badge.color || '').replace('#', '')
  if (hex.length !== 6) return null
  const n = parseInt(hex, 16)
  if (Number.isNaN(n)) return null
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
})

const ringStyle = computed(() => {
  if (!props.earned || !rgb.value) return {}
  return {
    background: `rgba(${rgb.value}, 0.12)`,
    borderColor: `rgba(${rgb.value}, 0.45)`
  }
})

const iconStyle = computed(() =>
  props.earned && props.badge.color ? { color: props.badge.color } : {}
)
</script>

<style scoped>
.medal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 82px;
  flex: none;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.medal__ring {
  width: 58px;
  height: 58px;
  transition: transform var(--p-duration) var(--p-ease);
}

.medal:active .medal__ring {
  transform: scale(0.94);
}

.medal__icon {
  font-size: 28px;
  color: var(--p-text-muted);
}

.medal__name {
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: var(--p-text-secondary);
  /* Two lines then ellipsis: badge names are gym-authored and some are long,
     and a third line would break the row's alignment. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Locked: the shape survives, the colour does not. */
.medal--locked .medal__ring {
  background: var(--p-bg-card);
  border-color: var(--p-border-light);
}

.medal--locked .medal__icon {
  color: var(--p-text-dark);
}

.medal--locked .medal__name {
  color: var(--p-text-dim);
}
</style>
