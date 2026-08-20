<template>
  <f7-sheet
    :opened="opened"
    style="height: auto"
    swipe-to-close
    backdrop
    @sheet:closed="close"
  >
    <div class="swipe-handler">
      <span class="tt__grip" />
    </div>

    <div v-if="item" class="tt">
      <p class="tt__what">{{ what }}</p>

      <!-- What the coach prescribed, before any adjusting. -->
      <p v-if="detail" class="tt__detail">{{ detail }}</p>

      <div
        class="tt__dial"
        :class="`tt__dial--${timer.phase.value}`"
      >
        <span class="tt__phase">{{ timer.label.value || t('training.timer_ready_to_start') }}</span>
        <span class="tt__count num">{{ display }}</span>
        <span
          v-if="timer.phase.value !== 'idle'"
          class="tt__round"
        >{{ t('training.timer_round', { n: timer.round.value, of: timer.rounds.value }) }}</span>
      </div>

      <!-- Editable until it starts. A coach's 180 seconds is a starting point
           on a day your fingers disagree. -->
      <div v-if="timer.phase.value === 'idle'" class="tt__set">
        <label class="tt__field">
          <span>{{ t('training.timer_sets') }}</span>
          <input v-model.number="timer.rounds.value" type="number" inputmode="numeric" min="1">
        </label>
        <label class="tt__field">
          <span>{{ t('training.timer_work') }}</span>
          <input v-model.number="timer.workSeconds.value" type="number" inputmode="numeric" min="1">
        </label>
        <label class="tt__field">
          <span>{{ t('training.timer_rest') }}</span>
          <input v-model.number="timer.restSeconds.value" type="number" inputmode="numeric" min="0">
        </label>
      </div>

      <div class="tt__actions">
        <button
          v-if="timer.phase.value === 'idle' || timer.phase.value === 'done'"
          class="tt__go"
          :disabled="!timer.workSeconds.value"
          @click="timer.start()"
        >
          {{ t('training.timer_start') }}
        </button>
        <template v-else>
          <button
            class="tt__go tt__go--quiet"
            @click="timer.running.value ? timer.pause() : timer.resume()"
          >
            {{ timer.running.value ? t('training.timer_pause') : t('training.timer_resume') }}
          </button>
          <button class="tt__go tt__go--quiet" @click="timer.reset()">
            {{ t('training.timer_reset') }}
          </button>
        </template>
      </div>

      <p class="tt__hint">{{ t('training.timer_hint') }}</p>
    </div>
  </f7-sheet>
</template>

<script setup>
/**
 * An interval timer that already knows the set.
 *
 * The importer keeps a hangboard prescription as fields rather than prose —
 * sets, duration_seconds, rest_seconds, and the edge and grip in params — so
 * "20 mm half crimp, 5 × 7 s, 3 min rest" arrives here as numbers. Tapping
 * the timer should therefore cost one tap, not a setup screen.
 */
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntervalTimer } from '@helpers/useIntervalTimer.js'

const props = defineProps({
  opened: { type: Boolean, default: false },
  item: { type: Object, default: null }
})

const emit = defineEmits(['update:opened'])

const { t } = useI18n()
const timer = useIntervalTimer()

/** params is a cast attribute, but a raw JSON string in some payloads. */
const params = computed(() => {
  const p = props.item?.params
  if (!p) return {}
  if (typeof p === 'string') {
    try {
      return JSON.parse(p)
    } catch {
      return {}
    }
  }
  return p
})

// Edge and grip first: on a hangboard those are what you set up before you
// start, and they are the two things the notes bury in a sentence.
const what = computed(() => {
  const bits = []
  if (params.value.edge_mm) bits.push(`${params.value.edge_mm} mm`)
  if (params.value.grip) bits.push(params.value.grip)
  if (bits.length) return bits.join(' · ')
  return props.item?.notes || t('training.timer_title')
})

const detail = computed(() => {
  const bits = []
  if (params.value.intensity) bits.push(params.value.intensity)
  if (props.item?.load_kg != null) bits.push(`${props.item.load_kg} kg`)
  return bits.join(' · ')
})

const display = computed(() => {
  const s = timer.remaining.value
  if (timer.phase.value === 'idle') return timer.workSeconds.value ? `${timer.workSeconds.value}` : '—'
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')}` : String(s)
})

// Reload the prescription each time it opens, so adjusting one exercise's
// numbers never leaks into the next.
watch(
  () => [props.opened, props.item?.id],
  ([open]) => {
    if (!open) return
    timer.reset()
    timer.rounds.value = props.item?.sets ?? 1
    timer.workSeconds.value = props.item?.duration_seconds ?? 0
    timer.restSeconds.value = props.item?.rest_seconds ?? 0
  },
  { immediate: true }
)

const close = () => {
  timer.stop()
  emit('update:opened', false)
}
</script>

<style scoped>
.swipe-handler {
  display: flex;
  justify-content: center;
  padding: 0.6rem 0 0.2rem;
}

.tt__grip {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--p-text-dark);
  opacity: 0.5;
}

.tt {
  padding: 0.5rem 1rem 1.75rem;
  text-align: center;
}

.tt__what {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--p-text);
}

.tt__detail {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--p-text-muted);
}

/* The one thing readable from arm's length on a board. */
.tt__dial {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  margin: 1.1rem 0;
  padding: 1.3rem 1rem;
  border-radius: 18px;
  border: 2px solid var(--p-border);
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 160ms ease, background 160ms ease;
}

/* Colour carries the phase, because at arm's length the word is unreadable
   and the number is not. */
.tt__dial--work {
  border-color: var(--p-success, #4ade80);
  background: rgba(74, 222, 128, 0.08);
}

.tt__dial--rest {
  border-color: var(--p-accent);
  background: rgba(var(--p-accent-rgb), 0.08);
}

.tt__dial--ready { border-color: var(--p-warning, #f59e0b); }
.tt__dial--done { border-color: var(--p-success, #4ade80); }

.tt__phase {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.tt__count {
  font-size: 3.4rem;
  line-height: 1.05;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--p-text);
}

.tt__round {
  font-size: 0.78rem;
  color: var(--p-text-muted);
}

.tt__set {
  display: flex;
  gap: 0.5rem;
}

.tt__field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-dark);
}

.tt__field input {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--p-text);
  font-size: 1rem;
  text-align: center;
}

.tt__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

.tt__go {
  flex: 1;
  padding: 0.85rem;
  border: none;
  border-radius: 12px;
  background: rgba(var(--p-accent-rgb), 0.9);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
}

.tt__go--quiet {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--p-text-muted);
}

.tt__go:disabled { opacity: 0.4; }

.tt__hint {
  margin: 0.8rem 0 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--p-text-dark);
}
</style>
