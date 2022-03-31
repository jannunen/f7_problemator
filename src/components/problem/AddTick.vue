<template>
  <f7-sheet v-if="opened" :opened="opened"
  @backdropclick="() => ($emit('close'))"
  
  >
    <div class="flex p-3 mt-2 grid grid-cols-3">
      <div
        class="flex flex-col items-center justify-center font-bold"
        @click="openTickDatePopup"
      >
        <i
          class="icon material-icons color-custom"
          style="font-size: 42px; color: #2f2d51"
          >today</i
        >
        {{ formatDate(tick.created) }}
      </div>
      <div
        class="flex flex-col items-center justify-center font-bold"
        @click="openTriesPopup"
      >
        <round-badge text-color="#fff" bg-color="#2F2D51" :width="38">{{
          tick.tries
        }}</round-badge>
        {{ $tc('problem.tries', tick.tries) }}
      </div>
      <div
        class="flex flex-col items-center justify-center font-bold"
        @click="openGradeOpinionPopup"
      >
        <round-badge text-color="#fff" bg-color="#2F2D51" :width="38">{{
          getGrade(tick.grade_opinion)
        }}</round-badge>
        {{ $t('problem.grade_opinion') }}
      </div>
    </div>
    <div class="flex flex-row p-3 mt-1 font-bold grid grid-cols-2">
      <div class="flex justify-center">
        <input
          :checked="tick.ticktype == 'tick'"
          name="ticktype"
          type="radio"
          value="tick"
          @change="() => onAscentTypeChange('tick')"
        />
        {{ $t('problem.send') }}
      </div>
      <div>
        <input
          type="radio"
          :checked="tick.ticktype == 'pretick'"
          :disabled="problem.myTicks != null && problem.myTicks.length > 0"
          name="ticktype"
          value="pretick"
          @change="() => onAscentTypeChange('pretick')"
        />
        {{ $t('problem.still_a_project') }}
        <small v-if="problem.myTicks != null && problem.myTicks.length > 0">{{
          $t('problem.projecting_not_possible')
        }}</small>
      </div>
    </div>
    <div class="my-2 mx-4">
      <button @click="saveTick" large round fill color="blue">
        + {{ $t('problem.add_a_tick') }}
      </button>
      <button class="my-1" @click="$emit('close')" large round fill color="red">
        {{ $t('global.close_action') }}
      </button>
    </div>
  </f7-sheet>
</template>

<script setup>
import dayjs from 'dayjs'
import RoundBadge from '@components/ui/RoundBadge.vue'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import TickDate from '@components/problem/TickDate.vue'
import GradeOpinion from '@components/problem/GradeOpinion.vue'
import Tries from '@components/problem/Tries.vue'

const { t, d, locale } = useI18n()
const props = defineProps({
  opened: { type : Boolean, default : false},
  tick: Object,
  problem: Object,
})
const emit = defineEmits(['close'])
const getGrade = (gradeid) => {
  if (gradeid == null) {
    return ''
  }
  return grades[gradeid].name
}
const myTick = ref(null)
onMounted(() => {
    myTick.value = props.tick
})
const saveTick = () => {
  // IF use has NOT selected grade opinion, make sure one is
  // NOT sent to the server
  let payload = { ...myTick.value }
  store
    .dispatch('saveTick', payload)
    .then((resp) => {
      toaster(resp.message)
      addTickSheetOpened.value = false
    })
    .catch((err) => {
      f7.dialog.alert(err)
    })
}
const onAscentTypeChange = (value) => {
    myTick.value.ticktype = value;
};
    const openTickDatePopup = () => {
      popupTickDateOpen.value = true;
    };
    const openTriesPopup = () => {
      popupTriesOpen.value = true;
    };
    const openGradeOpinionPopup = () => {
      popupGradeOpinionOpen.value = true;
    };
    const selectTries = (tries) => {
      tick.value.tries = tries;
      popupTriesOpen.value=false
    };
    const gradeOpinionSelected = (gradeid) => {
      tick.value.grade_opinion = gradeid;
      popupGradeOpinionOpen.value = false
    };
    const setCalendarDate = (date) => {
      calendar.value.setValue([date]);
    };

const formatDate = (date) => {
  if (dayjs(date).isSame(new Date(), 'day')) {
    return t('problem.today')
  }
  return dayjs(date).format('DD.MM.YYYY')
}
</script>

<style></style>
