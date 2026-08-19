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
        @click="open(kind.type)"
      >
        <span class="material-icons report__icon">{{ kind.icon }}</span>
        <span class="report__label">{{ t(kind.label) }}</span>
        <span v-if="counts[kind.type] > 0" class="report__count num">{{ counts[kind.type] }}</span>
      </button>
    </div>

    <f7-sheet v-model:opened="sheetOpen" style="height: auto" close-by-outside-click swipe-to-close>
      <div class="report-sheet">
        <div class="report-sheet__kind" :class="`report-sheet__kind--${pending}`">
          <span class="material-icons">{{ pendingKind?.icon }}</span>
          {{ pendingKind ? t(pendingKind.label) : '' }}
        </div>

        <label class="report-sheet__label" for="report-note">
          {{ t('report.note_label') }}
        </label>
        <textarea
          id="report-note"
          v-model="note"
          class="report-sheet__input"
          rows="3"
          :maxlength="NOTE_MAX"
          :placeholder="t('report.note_placeholder')"
        />
        <div class="report-sheet__count num">{{ note.length }}/{{ NOTE_MAX }}</div>

        <div class="report-sheet__actions">
          <button type="button" class="report-sheet__cancel" @click="sheetOpen = false">
            {{ t('report.cancel') }}
          </button>
          <button
            type="button"
            class="report-sheet__send"
            :disabled="busy !== null"
            @click="send"
          >
            {{ busy ? t('report.sending') : t('report.send') }}
          </button>
        </div>
      </div>
    </f7-sheet>
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

const NOTE_MAX = 500

const { t } = useI18n()
const store = useStore()
const busy = ref(null)
const sheetOpen = ref(false)
const pending = ref(null)
const note = ref('')

const pendingKind = computed(() => KINDS.find((k) => k.type === pending.value) ?? null)

const reports = computed(() => props.problem.reports ?? {})
const counts = computed(() => ({
  dirty: reports.value.dirty ?? 0,
  dangerous: reports.value.dangerous ?? 0
}))
const mine = computed(() => ({
  dirty: reports.value.mine?.dirty ?? false,
  dangerous: reports.value.mine?.dangerous ?? false
}))

function open(type) {
  pending.value = type
  // Cleared per report rather than kept: a note about loose bolts should not
  // follow the climber to the next route they flag.
  note.value = ''
  sheetOpen.value = true
}

async function send() {
  const type = pending.value
  if (!type) return
  busy.value = type
  try {
    // The note is optional and stays optional — sending with an empty field
    // files the flag on its own, which is the common case when someone is
    // standing under the route with chalky hands.
    await store.dispatch('reportProblem', { id: props.problem.id, type, note: note.value.trim() })
    sheetOpen.value = false
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

.report-sheet {
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1.25rem 1.75rem;
}

.report-sheet__kind {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--p-warning);
}

.report-sheet__kind--dangerous {
  color: var(--p-danger);
}

.report-sheet__label {
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
  color: var(--p-text-muted);
}

.report-sheet__input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius);
  background: var(--p-bg-card);
  color: var(--p-text);
  font-size: 0.9rem;
  line-height: 1.4;
  resize: none;
}

.report-sheet__input:focus {
  outline: none;
  border-color: var(--p-border-accent);
}

.report-sheet__count {
  margin-top: 0.25rem;
  font-size: 0.68rem;
  text-align: right;
  color: var(--p-text-dark);
}

.report-sheet__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.report-sheet__cancel,
.report-sheet__send {
  flex: 1;
  padding: 0.7rem 0.5rem;
  border-radius: var(--p-radius);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--p-border-light);
}

.report-sheet__cancel {
  background: none;
  color: var(--p-text-muted);
}

.report-sheet__send {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.4);
  color: var(--p-warning);
}

.report-sheet__send:disabled {
  opacity: 0.6;
  cursor: default;
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
