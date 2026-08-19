<template>
  <div class="report">
    <div class="report__title">{{ t('report.title') }}</div>
    <div class="report__row">
      <button
        v-for="kind in KINDS"
        :key="kind.type"
        type="button"
        class="report__btn"
        :class="{ 'report__btn--mine': mine[kind.type], 'report__btn--busy': busy === kind.type }"
        :disabled="mine[kind.type] || busy !== null"
        @click="send(kind.type)"
      >
        <span class="material-icons report__icon">{{ kind.icon }}</span>
        <span class="report__label">{{ t(kind.label) }}</span>
        <span v-if="counts[kind.type] > 0" class="report__count num">{{ counts[kind.type] }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Flagging a route as dirty or dangerous.
 *
 * The report goes into the same problemator_message queue routesetters have
 * always worked from, so this is not a new channel — it is the app finally
 * writing to the old one.
 *
 * The count shown is people, not taps: the API keeps one open report per
 * climber per type, and a climber who has already reported sees their button
 * marked and disabled rather than being able to pile on.
 */
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'

const props = defineProps({
  problem: { type: Object, required: true }
})

const KINDS = [
  { type: 'dirty', icon: 'cleaning_services', label: 'report.dirty' },
  { type: 'dangerous', icon: 'warning', label: 'report.dangerous' }
]

const { t } = useI18n()
const store = useStore()
const busy = ref(null)

const reports = computed(() => props.problem.reports ?? {})
const counts = computed(() => ({
  dirty: reports.value.dirty ?? 0,
  dangerous: reports.value.dangerous ?? 0
}))
const mine = computed(() => ({
  dirty: reports.value.mine?.dirty ?? false,
  dangerous: reports.value.mine?.dangerous ?? false
}))

async function send(type) {
  busy.value = type
  try {
    await store.dispatch('reportProblem', { id: props.problem.id, type })
    f7.toast.show({ text: t('report.thanks'), closeTimeout: 2500, position: 'bottom' })
  } catch (err) {
    // Saying nothing would leave the climber unsure whether it went through,
    // and they are standing under the route they are worried about.
    console.warn('report failed:', err?.message ?? err)
    f7.toast.show({ text: t('report.failed'), closeTimeout: 3000, position: 'bottom' })
  } finally {
    busy.value = null
  }
}
</script>

<style scoped>
.report {
  padding: 0 1rem 0.5rem;
}

.report__title {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: var(--p-text-dim);
}

.report__row {
  display: flex;
  gap: 0.5rem;
}

.report__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.6rem 0.5rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius);
  background: var(--p-bg-card);
  color: var(--p-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--p-duration) var(--p-ease), color var(--p-duration) var(--p-ease);
  -webkit-tap-highlight-color: transparent;
}

.report__icon {
  font-size: 18px;
}

/* Already reported by this climber: acknowledged, not an error — amber, and
   out of action rather than merely dimmed, so a second tap is not offered. */
.report__btn--mine {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
  color: var(--p-warning);
  cursor: default;
}

.report__btn--busy {
  opacity: 0.6;
}

.report__btn:disabled:not(.report__btn--mine) {
  opacity: 0.5;
  cursor: default;
}

.report__count {
  min-width: 1.25em;
  padding: 0 0.35em;
  border-radius: var(--p-radius-full);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.7rem;
}
</style>
