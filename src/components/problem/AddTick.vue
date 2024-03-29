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
  <div class="flex p-3 mt-2 grid grid-cols-3">
    <div
      class="flex flex-col items-center justify-center font-bold"
      @click="openTickDatePopup"
    >
      <i class="icon material-icons color-custom" style="font-size: 42px; "
        >today</i
      >
      {{ formatDate(tick.created) }}
    </div>
    <div
      class="flex flex-col items-center justify-center font-bold"
      @click="openTriesPopup"
    >
       <f7-stepper class="my-1" v-model:value="tick.tries" min="1" max="9999" decimal-point="0" large round fill></f7-stepper>
      {{ t('problem.tries', tick.tries) }}
    </div>
    <div
      class="flex flex-col items-center justify-center font-bold"
      @click="openGradeOpinionPopup"
    >
      <div class="dark:bg-sky-400 dark:text-white rounded-full w-12 h-12 text-center py-3">{{
        getGrade(tick.grade_opinion)
      }}</div>
      {{ t('problem.grade_opinion') }}
    </div>
  </div>
  <div class="flex flex-row p-3 mt-1 font-bold grid grid-cols-2">
    <div class="flex justify-center">
      <label for="ascent">
        <input
            :checked="tick.ticktype == 'tick'"
            name="ticktype"
            type="radio"
            id="ascent"
            value="tick"
            @change="() => onAscentTypeChange('tick')"
        />
        <span class="px-2"> {{ t('problem.send') }} </span>
      </label>
    </div>
    <div>
      <label for="projecting">
        <input
            type="radio"
            :checked="tick.ticktype == 'pretick'"
            :disabled="problem.myTicks != null && problem.myTicks.length > 0"
            id="projecting"
            name="ticktype"
            value="pretick"
            @change="() => onAscentTypeChange('pretick')"
        />
        
        <span class="px-2" v-if="problem.myTicks != null && problem.myTicks.length > 0">{{ t('problem.projecting_not_possible') }}</span>
        <span v-else class="px-2">{{ t('problem.still_a_project') }}</span>
      </label>
    </div>
  </div>
      <div class="w-full text-center px-2" v-if="problem.myTicks != null && problem.myTicks.length > 0">{{ t('problem.projecting_not_possible_desc') }}</div>
  <div class="my-2 mx-4">
    <f7-button
      @click="saveTick"
      class="uppercase block text-center button py-2 h-12 px-4 dark:bg-sky-500 bg-green-500 text-white"
    >
      {{ t('problem.btn_add_tick') }}

    </f7-button>

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
  </div>
</template>
<style></style>
