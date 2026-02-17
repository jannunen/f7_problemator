<script setup>
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import { f7 } from 'framework7-vue'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { toaster, alert } from '@js/helpers/notifications.js'
import PopupGradeOpinion from '@components/problem/GradeOpinion.vue'
import PopupTickDate from '@components/problem/TickDate.vue'
const store = useStore()

const { t } = useI18n()
const grades = computed(() => store.state.grades)

const props = defineProps({
  opened: { type: Boolean, default: false },
  problem: Object,
})
const emit = defineEmits(['close'])
const tickSkeleton = {
  ticktype: 'tick',
  tries: 1,
  created: new Date(),
  problemid: props.problem.id,
  grade_opinion: null,
}
const tick = ref(tickSkeleton)
const getGrade = (gradeid) => {
  if (gradeid == null) {
    return 'N/A'
  }
  return grades.value[gradeid].name
}
const gradeSelected = (grade) => {
    tick.value.grade_opinion = grade
    popupGradeOpinionOpen.value = false
}
const dateSelected = (date) => {
    tick.value.created = date
    popupTickDateOpen.value = false
}


const saveTick = () => {
  let payload = { ...tick.value }
  store.dispatch('saveTick', payload)
    .then((resp) => {
      toaster(resp.message)
      // Show badge earned notifications
      if (resp.new_badges && resp.new_badges.length > 0) {
        resp.new_badges.forEach(badge => {
          setTimeout(() => {
            toaster('You earned: ' + badge.name, 'Badge Unlocked!')
          }, 500)
        })
      }
      // Navigate back.
      f7.views.main.router.back()

    })
    .catch((err) => {
      alert(err)
    })
}
const popupGradeOpinionOpen = ref(false)
const popupTickDateOpen = ref(false)

const onAscentTypeChange = (value) => {
  tick.value.ticktype = value
}
const openTickDatePopup = () => {
  popupTickDateOpen.value = true
}
const openGradeOpinionPopup = () => {
  popupGradeOpinionOpen.value = true
}

const formatDate = (date) => {
  if (dayjs(date).isSame(new Date(), 'day')) {
    return t('problem.today')
  }
  return dayjs(date).format('DD.MM.YYYY')
}
</script>

<template>
  <!-- Tick controls -->
  <div class="grid grid-cols-3 gap-2 my-3">
    <!-- Date picker -->
    <button class="tick-control" @click="openTickDatePopup">
      <span class="material-icons tick-control__icon">today</span>
      <span class="tick-control__value">{{ formatDate(tick.created) }}</span>
    </button>
    <!-- Tries stepper -->
    <div class="tick-control">
      <f7-stepper class="my-1" v-model:value="tick.tries" min="1" max="9999" decimal-point="0" large round fill></f7-stepper>
      <span class="tick-control__label">{{ t('problem.tries', tick.tries) }}</span>
    </div>
    <!-- Grade opinion -->
    <button class="tick-control" @click="openGradeOpinionPopup">
      <div class="grade-circle">{{
        getGrade(tick.grade_opinion)
      }}</div>
      <span class="tick-control__label">{{ t('problem.grade_opinion') }}</span>
    </button>
  </div>

  <!-- Ascent type selector -->
  <div class="p-toggle-group my-3">
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': tick.ticktype == 'tick' }"
      @click="onAscentTypeChange('tick')"
    >
      <span class="material-icons" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">check_circle</span>
      {{ t('problem.send') }}
    </button>
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': tick.ticktype == 'pretick' }"
      :disabled="problem.myTicks != null && problem.myTicks.length > 0"
      @click="onAscentTypeChange('pretick')"
      :style="problem.myTicks != null && problem.myTicks.length > 0 ? 'opacity: 0.4; pointer-events: none;' : ''"
    >
      <span class="material-icons" style="font-size: 16px; vertical-align: middle; margin-right: 4px;">pending</span>
      <span v-if="problem.myTicks != null && problem.myTicks.length > 0">{{ t('problem.projecting_not_possible') }}</span>
      <span v-else>{{ t('problem.still_a_project') }}</span>
    </button>
  </div>

  <div v-if="problem.myTicks != null && problem.myTicks.length > 0" class="text-center text-xs mb-3" style="color: var(--p-text-dim);">
    {{ t('problem.projecting_not_possible_desc') }}
  </div>

  <!-- Save button -->
  <button @click="saveTick" class="p-btn p-btn--primary p-btn--block" style="height: 48px; font-size: 0.95rem;">
    {{ t('problem.btn_add_tick') }}
  </button>

  <PopupGradeOpinion
    :opened="popupGradeOpinionOpen"
    key="popupgradeopinion"
    @select="gradeSelected"
    @close="popupGradeOpinionOpen=false"
  />
  <popup-tick-date
    :opened="popupTickDateOpen"
    key="popuptickdate"
    @select="dateSelected"
    @close="popupTickDateOpen=false"
  />
</template>

<style scoped>
.tick-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  border-radius: 12px;
  background: var(--p-bg-card);
  border: 1px solid var(--p-border);
  cursor: pointer;
  transition: all 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}
.tick-control:hover {
  border-color: var(--p-border-light);
}
.tick-control__icon {
  font-size: 36px;
  color: var(--p-accent);
  margin-bottom: 0.25rem;
}
.tick-control__value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text);
}
.tick-control__label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--p-text-muted);
  margin-top: 0.25rem;
}
.grade-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(var(--p-accent-rgb), 0.15);
  border: 1px solid rgba(var(--p-accent-rgb), 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--p-accent);
}
</style>
