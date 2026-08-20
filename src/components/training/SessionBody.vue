<template>
  <div class="sbody">
    <p v-if="session.notes" class="sess__notes">{{ session.notes }}</p>

    <!-- Your coach read this one and said something. It leads, because it is
         the only part of the page written to you personally. -->
    <div v-if="session.coach_notes" class="coachsays">
      <span class="coachsays__label">{{ t('training.coach_said') }}</span>
      <p class="coachsays__text">{{ session.coach_notes }}</p>
    </div>

    <div
      v-for="item in session.items ?? []"
      :key="item.id"
      class="item"
      :class="{ 'item--done': item.result }"
    >
      <div class="item__head">
        <span class="item__kind">{{ t('training.kind_' + item.kind) }}</span>
        <i
          class="material-icons item__state"
          :class="{ 'item__state--skipped': item.result?.skipped }"
        >{{ item.result ? (item.result.skipped ? 'remove_circle' : 'check_circle') : 'radio_button_unchecked' }}</i>
      </div>

      <!-- The coach's own words lead. The parsed numbers sit under them,
           because the words carry the intent and the numbers are only what
           the app could make of them. -->
      <p v-if="item.notes" class="item__words">{{ item.notes }}</p>
      <p v-if="prescribedOf(item)" class="item__numbers">{{ prescribedOf(item) }}</p>

      <p v-if="actualOf(item) || item.result?.feeling" class="item__actual">
        <span v-if="item.result?.feeling" class="item__face">
          {{ FACES[item.result.feeling - 1] }}
        </span>
        <template v-if="actualOf(item)">
          {{ t('training.you_did') }} {{ actualOf(item) }}
        </template>
      </p>

      <div v-if="editing === item.id" class="log">
        <!-- Only the fields this exercise was prescribed in. Asking a
             climber for reps on a rest day is how a form gets abandoned. -->
        <div class="log__row">
          <label v-if="item.sets != null" class="log__field">
            <span>{{ t('training.sets_short') }}</span>
            <input v-model.number="form.actual_sets" type="number" inputmode="numeric">
          </label>
          <label v-if="item.reps != null" class="log__field">
            <span>{{ t('training.reps_short') }}</span>
            <input v-model.number="form.actual_reps" type="number" inputmode="numeric">
          </label>
          <label v-if="item.load_kg != null" class="log__field">
            <span>kg</span>
            <input v-model.number="form.actual_load_kg" type="number" inputmode="decimal">
          </label>
          <label v-if="item.target_count != null" class="log__field">
            <span>{{ t('training.count_short') }}</span>
            <input v-model.number="form.actual_count" type="number" inputmode="numeric">
          </label>
          <label class="log__field log__field--wide">
            <span>{{ t('training.effort_label') }}</span>
            <input v-model.number="form.rpe" type="number" inputmode="numeric" min="1" max="10">
          </label>
        </div>

        <div class="log__feel">
          <span class="log__feellabel">{{ t('training.how_was_this') }}</span>
          <div class="feeling__row">
            <button
              v-for="n in 5"
              :key="n"
              class="feeling__btn"
              :class="{ 'feeling__btn--on': form.feeling === n }"
              @click="form.feeling = form.feeling === n ? null : n"
            >
              {{ FACES[n - 1] }}
            </button>
          </div>
        </div>

        <input
          v-model="form.notes"
          class="log__notes"
          type="text"
          :placeholder="t('training.how_did_it_go')"
        >

        <div class="log__actions">
          <button class="log__btn log__btn--save" @click="save(item)">
            {{ t('training.save') }}
          </button>
          <button class="log__btn" @click="skip(item)">
            {{ t('training.skip') }}
          </button>
          <button class="log__btn" @click="editing = null">
            {{ t('training.cancel') }}
          </button>
        </div>
      </div>

      <button v-else class="item__log" @click="edit(item)">
        {{ item.result ? t('training.edit_log') : t('training.log_it') }}
      </button>
    </div>

    <!-- Completing the day is separate from logging each item: a climber may
         do the session and never fill a single number, and that is still a
         session done. -->
    <div class="finish">
      <!-- One tap, five options, no labels to read. Asking how it went at the
           moment of finishing is the only time anyone will answer. -->
      <div v-if="!session.completed_at" class="feeling">
        <span class="feeling__label">{{ t('training.how_was_it') }}</span>
        <div class="feeling__row">
          <button
            v-for="n in 5"
            :key="n"
            class="feeling__btn"
            :class="{ 'feeling__btn--on': feeling === n }"
            @click="feeling = feeling === n ? null : n"
          >
            {{ FACES[n - 1] }}
          </button>
        </div>
      </div>

      <button
        class="finish__btn"
        :class="{ 'finish__btn--undo': session.completed_at }"
        @click="toggleComplete"
      >
        {{ session.completed_at ? t('training.mark_not_done') : t('training.mark_done') }}
      </button>
      <p v-if="session.completed_at" class="finish__when">
        {{ t('training.completed_on', { date: String(session.completed_at).slice(0, 10) }) }}
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * One session's exercises and its finish control.
 *
 * Shared by the full session page and the calendar's day sheet. It lived only
 * on the page, so the sheet could show a session but not log one — the same
 * day offered different powers depending on how you reached it.
 *
 * Recording is the parent's cue to refetch: this component does not own the
 * assignment, so it reports `changed` rather than mutating what it was given.
 */
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import api from '@js/api.js'
import { actual, prescribed } from '@helpers/trainingFormat.js'

const props = defineProps({
  session: { type: Object, required: true }
})
const emit = defineEmits(['changed'])

const { t } = useI18n()
const store = useStore()

// Faces rather than numbers: 1-5 means nothing without a legend, and nobody
// reads a legend at the end of a hard session.
const FACES = ['😞', '😕', '😐', '🙂', '😃']
const feeling = ref(null)
const editing = ref(null)
const form = reactive({})

const prescribedOf = (item) => prescribed(item, t)
const actualOf = (item) => actual(item, t)

const edit = (item) => {
  editing.value = item.id
  // Prefill from what was prescribed: most of the time a climber did what was
  // asked, and confirming a number is faster than typing it.
  Object.assign(form, {
    actual_sets: item.result?.actual_sets ?? item.sets ?? null,
    actual_reps: item.result?.actual_reps ?? item.reps ?? null,
    actual_load_kg: item.result?.actual_load_kg ?? item.load_kg ?? null,
    actual_count: item.result?.actual_count ?? item.target_count ?? null,
    rpe: item.result?.rpe ?? null,
    feeling: item.result?.feeling ?? null,
    notes: item.result?.notes ?? ''
  })
}

const save = async (item, extra = {}) => {
  await api.recordTrainingResult({ itemId: item.id, ...form, ...extra })
  editing.value = null
  emit('changed')
}

const skip = (item) => save(item, { skipped: true })

const toggleComplete = async () => {
  await api.completeTrainingSession({
    id: props.session.id,
    completed: !props.session.completed_at,
    // Without the gym the logged session has no location, and every
    // gym-scoped view of a climber's history quietly misses it.
    gymid: store.state.gymid ?? store.state.gym?.id ?? null,
    feeling: feeling.value
  })
  emit('changed')
}
</script>

<style scoped>
.coachsays {
  margin: 0 1rem 0.9rem;
  padding: 0.7rem 0.9rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--p-accent-rgb), 0.35);
  background: rgba(var(--p-accent-rgb), 0.07);
}

.coachsays__label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-accent);
}

.coachsays__text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--p-text);
}

.log__feel {
  margin-top: 0.7rem;
}

.log__feellabel {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-dark);
}

/* Wider basis than the number fields: the label is words, not a unit. */
.log__field--wide {
  flex: 1 1 7rem;
}

.item__face {
  margin-right: 0.3rem;
  font-size: 0.95rem;
}

.feeling { margin-bottom: 0.9rem; }

.feeling__label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--p-text-dark);
  text-align: center;
}

.feeling__row {
  display: flex;
  gap: 0.4rem;
}

.feeling__btn {
  flex: 1;
  padding: 0.5rem 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: none;
  font-size: 1.25rem;
  filter: grayscale(1);
  opacity: 0.5;
}

/* The chosen one comes into colour; the rest stay grey. Colour alone carries
   the selection, so nothing needs a border to shout. */
.feeling__btn--on {
  filter: none;
  opacity: 1;
  border-color: rgba(var(--p-accent-rgb), 0.4);
  background: rgba(var(--p-accent-rgb), 0.08);
}

.sess__notes {
  margin: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--p-text-dim);
}

.item {
  margin: 0 1rem 0.75rem;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.item--done { border-color: rgba(74, 222, 128, 0.25); }

.item__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item__kind {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--p-accent);
}

.item__state {
  margin-left: auto;
  font-size: 1.2rem;
  color: var(--p-success, #4ade80);
}

.item__state--skipped { color: var(--p-text-dark); }

.item__words {
  margin: 0.5rem 0 0;
  font-size: 0.92rem;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--p-text);
}

.item__numbers {
  margin: 0.3rem 0 0;
  font-size: 0.8rem;
  color: var(--p-text-dim);
}

/* What you did, against what was asked — the one line a coach reads. */
.item__actual {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  color: var(--p-success, #4ade80);
}

.item__log {
  margin-top: 0.7rem;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: none;
  color: var(--p-text-muted);
  font-size: 0.8rem;
}

.log { margin-top: 0.8rem; }

.log__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.log__field {
  flex: 1 1 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--p-text-dark);
}

.log__field input {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--p-text);
  font-size: 0.95rem;
  text-align: center;
}

.log__notes {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--p-text);
  font-size: 0.85rem;
}

.log__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.log__btn {
  flex: 1;
  padding: 0.55rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: none;
  color: var(--p-text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.log__btn--save {
  background: rgba(var(--p-accent-rgb), 0.9);
  border-color: transparent;
  color: #fff;
}

.finish { margin: 1.5rem 1rem 2rem; }

.finish__btn {
  width: 100%;
  padding: 0.85rem;
  border-radius: 12px;
  border: none;
  background: rgba(var(--p-accent-rgb), 0.9);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
}

.finish__btn--undo {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: var(--p-text-muted);
}

.finish__when {
  margin: 0.5rem 0 0;
  text-align: center;
  font-size: 0.78rem;
  color: var(--p-text-dim);
}
</style>
