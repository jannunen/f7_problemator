<template>
  <f7-sheet
    class="daysheet-modal"
    :opened="opened"
    style="height: auto; max-height: 88vh"
    backdrop
    close-by-outside-click
    close-by-backdrop-click
    swipe-to-close
    @sheet:closed="$emit('update:opened', false)"
  >
    <!-- The stripe: a sheet that can be swiped away should look like it can.
         Without it the gesture is a secret, and the only way out is the
         backdrop. -->
    <div class="swipe-handler">
      <span class="daysheet__grip" />
    </div>

    <div v-if="session" class="page-content daysheet">
      <p class="daysheet__when">{{ whenLabel }}</p>
      <h2 class="daysheet__title">
        {{ session.title || t('training.session') }}
        <i v-if="session.completed_at" class="material-icons daysheet__tick">check_circle</i>
      </h2>

      <!-- A rest day has nothing to prescribe, and a form asking for reps on
           it is how a form gets abandoned — but it is still a day you tick
           off, so the finish control stays. -->
      <p v-if="rest" class="daysheet__rest">{{ t('training.rest_explainer') }}</p>

      <!-- The same body the full page renders: reaching a day through the
           calendar should not give you less to do with it. -->
      <session-body
        :session="session"
        :hide-items="rest"
        @changed="$emit('changed')"
      />
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
import { isRest, sessionDate } from '@helpers/trainingFormat.js'
import SessionBody from '@components/training/SessionBody.vue'

const props = defineProps({
  opened: { type: Boolean, default: false },
  session: { type: Object, default: null },
  startsOn: { type: String, default: null }
})

defineEmits(['update:opened', 'changed'])

const { t, locale } = useI18n()

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
  padding: 1rem 0 1.5rem;
  overflow-y: auto;
}

/* The grip, sized like every other sheet's in the app so it reads as the
   same affordance. */
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

.daysheet__when,
.daysheet__title,
.daysheet__rest {
  padding-inline: 1rem;
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












</style>
