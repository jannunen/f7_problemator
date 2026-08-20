<template>
  <!-- height:auto is required by swipe-to-step, not a style choice: the step
       height is measured from the content inside .sheet-modal-swipe-step. -->
  <f7-sheet
    class="daysheet-modal"
    :opened="opened"
    style="height: auto"
    swipe-to-close
    swipe-to-step
    backdrop
    @sheet:closed="$emit('update:opened', false)"
  >
    <div class="swipe-handler">
      <span class="daysheet__grip" />
    </div>

    <!-- .sheet-modal-swipe-step is a direct child of the sheet, as the docs
         have it: Framework7 measures this element to decide where the sheet
         rests, and burying it inside a padded wrapper makes that measurement
         a guess. -->
    <template v-if="session">
      <!-- Step one: what this day asks of you. This is the whole answer to
           the tap most of the time — "what is Thursday?" — so it is what you
           get without swiping any further. -->
      <div class="sheet-modal-swipe-step daysheet__step">
        <p class="daysheet__when">{{ whenLabel }}</p>
        <h2 class="daysheet__title">
          {{ session.title || t('training.session') }}
          <i v-if="session.completed_at" class="material-icons daysheet__tick">check_circle</i>
        </h2>

        <p v-if="rest" class="daysheet__rest">{{ t('training.rest_explainer') }}</p>

        <ul v-else class="dsitems">
          <li v-for="item in session.items ?? []" :key="item.id" class="dsitem">
            <span class="dsitem__kind">{{ t('training.kind_' + item.kind) }}</span>
            <span v-if="item.notes" class="dsitem__words">{{ item.notes }}</span>
            <span v-if="prescribedOf(item)" class="dsitem__numbers num">
              {{ prescribedOf(item) }}
            </span>
            <i
              v-if="item.result"
              class="material-icons dsitem__state"
              :class="{ 'dsitem__state--skipped': item.result.skipped }"
            >{{ item.result.skipped ? 'remove_circle' : 'check_circle' }}</i>
          </li>
        </ul>
      </div>

      <!-- Past the step: the coach's words for the day, and the way through to
           logging it. Reading is a glance; recording needs the room of a page. -->
      <div class="daysheet__more">
        <p v-if="session.notes" class="daysheet__notes">{{ session.notes }}</p>

        <p v-if="session.completed_at" class="daysheet__done">
          {{ t('training.completed_on', { date: String(session.completed_at).slice(0, 10) }) }}
        </p>

        <button class="daysheet__go" @click="$emit('open', session)">
          {{ t('training.open_session') }}
        </button>
      </div>
    </template>
  </f7-sheet>
</template>

<script setup>
/**
 * One day of a programme, opened from the calendar.
 *
 * A swipe-to-step sheet: the step shows what the day asks of you, which is
 * what most taps are actually asking. Swiping further reveals the coach's
 * notes and the way through to the session page — the same page a weekday in
 * the list view opens, so both routes end in one place that can log.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { isRest, prescribed, sessionDate } from '@helpers/trainingFormat.js'

const props = defineProps({
  opened: { type: Boolean, default: false },
  session: { type: Object, default: null },
  startsOn: { type: String, default: null }
})

defineEmits(['update:opened', 'open'])

const { t, locale } = useI18n()

const prescribedOf = (item) => prescribed(item, t)
const rest = computed(() => isRest(props.session))

const whenLabel = computed(() => {
  const d = sessionDate(props.startsOn, props.session)
  if (d) {
    return d.toLocaleDateString(locale.value, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }
  // No start date: week and day are all the position there is.
  return t('training.week_day', {
    week: props.session?.week ?? 1,
    day: props.session?.day ?? 1
  })
})
</script>

<style scoped>
.swipe-handler {
  display: flex;
  justify-content: center;
  padding: 0.6rem 0 0.2rem;
  cursor: grab;
}

.daysheet__grip {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--p-text-dark);
  opacity: 0.5;
}

.daysheet__step {
  padding: 0.25rem 1rem 0.75rem;
}

.daysheet__when {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.daysheet__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.3rem 0 0;
  font-size: 1.15rem;
  color: var(--p-text);
}

.daysheet__tick {
  font-size: 1.1rem;
  color: var(--p-success);
}

.daysheet__rest,
.daysheet__notes {
  margin: 0.7rem 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--p-text-secondary);
}

.dsitems {
  margin: 0.8rem 0 0;
  padding: 0;
  list-style: none;
}

.dsitem {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 0.5rem;
  padding: 0.6rem 0;
  border-top: 1px solid var(--p-border);
}

.dsitem__kind {
  grid-column: 1;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-accent);
}

.dsitem__words {
  grid-column: 1;
  font-size: 0.85rem;
  line-height: 1.45;
  white-space: pre-wrap;
  color: var(--p-text);
}

.dsitem__numbers {
  grid-column: 1;
  font-size: 0.78rem;
  color: var(--p-text-dim);
}

/* Spans the rows so the mark sits against the whole exercise, not its kind. */
.dsitem__state {
  grid-column: 2;
  grid-row: 1 / -1;
  align-self: center;
  font-size: 1.1rem;
  color: var(--p-success, #4ade80);
}

.dsitem__state--skipped { color: var(--p-text-dark); }

.daysheet__more {
  padding: 0 1rem 1.5rem;
}

.daysheet__done {
  margin: 0.7rem 0 0;
  font-size: 0.78rem;
  color: var(--p-text-dim);
}

.daysheet__go {
  width: 100%;
  margin-top: 1rem;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  background: rgba(var(--p-accent-rgb), 0.9);
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
}
</style>
