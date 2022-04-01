<template>
  <f7-popup :opened="opened" class="popup_tick_date">
    <f7-page>
      <f7-navbar :title="t('problem.choose_tick_date')">
        <f7-nav-right>
          <f7-link @click.prevent="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <div class="flex flex-row justify-around">
          <f7-button
            @click="setCalendarDate(dayjs().subtract(1, 'day').toDate())"
            class="mx-2"
            round
            fill
            color="red"
            >{{ t('problem.yesterday') }}
          </f7-button>
          <f7-button
            @click="setCalendarDate(dayjs().toDate())"
            class="mx-2"
            round
            fill
            color="red"
            >{{ t('problem.today') }}
          </f7-button>
        </div>
        <div class="mt-3 mb-2 w-4/5 mx-auto text-center">
        <DatePicker 
        @dayclick="onDaySelected"
        v-model="date" />
        <br />
        {{ dateFormat(date,'DD.MM.YYYY') }}
        </div>
        <div class="mx-2 my-2 flex flex-col gap-2">
          <f7-button @click="emit('select', date)" large fill>{{
            t('problem.select_date')
          }}</f7-button>
          <f7-link color="orange" @click="emit('close')" >{{
            t('global.close_action')
          }}</f7-link>
        </div>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref} from 'vue'
import dayjs from 'dayjs'
import { dateFormat } from '@js/helpers/filters.js'
import { Calendar, SetupCalendar, DatePicker } from 'v-calendar';
const { t } = useI18n()
const props = defineProps({
  opened: Boolean,
})
const emit = defineEmits(['close', 'select'])
const date = ref(new Date());
const setCalendarDate = (indate) => {
  date.value = indate
}
const onDaySelected = ({date}) => {
  date.value = date
}
</script>

<style></style>
