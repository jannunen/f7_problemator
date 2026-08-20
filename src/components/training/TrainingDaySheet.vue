<template>
  <f7-sheet
    :opened="opened"
    style="height: auto"
    close-by-outside-click
    swipe-to-close
    @sheet:closed="$emit('update:opened', false)"
  >
    <div v-if="session" class="daysheet">
      <p class="daysheet__when">{{ whenLabel }}</p>
      <h2 class="daysheet__title">
        {{ session.title || t('training.session') }}
        <i v-if="session.completed_at" class="material-icons daysheet__tick">check_circle</i>
      </h2>

      <p v-if="session.notes" class="daysheet__notes">{{ session.notes }}</p>

      <!-- A rest day has nothing to list, and a list of one item reading
           "rest" is worse than the sentence. -->
      <p v-if="rest" class="daysheet__rest">{{ t('training.rest_explainer') }}</p>

      <ul v-else class="daysheet__items">
        <li v-for="item in session.items ?? []" :key="item.id" class="dsitem">
          <span class="dsitem__kind">{{ t('training.kind_' + item.kind) }}</span>
          <span v-if="prescribedOf(item)" class="dsitem__numbers num">
            {{ prescribedOf(item) }}
          </span>
          <span v-if="item.notes" class="dsitem__words">{{ item.notes }}</span>
        </li>
      </ul>

      <!-- The sheet is for reading; logging what you actually did needs the
           room of a full page. -->
      <button class="daysheet__go" @click="$emit('open', session)">
        {{ session.completed_at ? t('training.view_session') : t('training.log_session') }}
      </button>
    </div>
  </f7-sheet>
</template>

<script setup>
/**
 * One day of a programme, opened from the calendar.
 *
 * Tapping a dot to be thrown onto a full page loses your place in the month —
 * and most taps are a glance ("what is Thursday?"), not a session you are
 * about to log. The sheet answers the glance and keeps the calendar behind it.
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
.daysheet {
  padding: 1.25rem 1rem 1.5rem;
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

.daysheet__notes,
.daysheet__rest {
  margin: 0.6rem 0 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--p-text-secondary);
}

.daysheet__items {
  margin: 0.9rem 0 0;
  padding: 0;
  list-style: none;
}

.dsitem {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0.6rem 0;
  border-top: 1px solid var(--p-border);
}

.dsitem__kind {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.dsitem__numbers {
  font-size: 0.9rem;
  color: var(--p-text);
}

.dsitem__words {
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--p-text-secondary);
}

.daysheet__go {
  width: 100%;
  margin-top: 1.1rem;
  padding: 0.7rem;
  border: none;
  border-radius: var(--p-radius-sm, 6px);
  background: var(--p-accent);
  color: var(--p-text-dark);
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
