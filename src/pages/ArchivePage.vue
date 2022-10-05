<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link href="/">&lt; home</f7-link>
            </f7-nav-left>
            <f7-nav-title> {{ t('archive.archive_title') }} </f7-nav-title>
        </f7-navbar>
        <f7-block >
            <div class="flex flex-col items-center">
            <div class="flex flex-col">
                <div class="flex flex-row gap-2">
                    <div class="rounded-lg w-4 h-4 bg-red-500"></div>
                    <div>Day with ticks</div>
                </div>
                <div class="flex flex-row gap-2">
                    <div class="rounded-lg w-4 h-4 bg-orange-500"></div>
                    <div>Day with tries, no ticks</div>
                </div>
            </div>
            <hr />
            <calendar 
            :attributes='attrs'
            @dayclick="onDayClick"
            >
                <template #day-popover="{ day, format, masks }">
                    <div class="text-xs text-gray-300 font-semibold text-center">
                        {{ format(day.date, masks.dayPopover) }}
                    </div>
                </template>
            </calendar>
            Click a date to see the details
            </div>
        </f7-block>
    </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { f7, useStore } from 'framework7-vue'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'v-calendar/dist/style.css'
import { Calendar, SetupCalendar, DatePicker } from 'v-calendar';

dayjs.extend(relativeTime)
const { t } = useI18n()
store.dispatch("getTickDates")
const tickDates = useStore('tickDates')
const attrs = computed(() => [ 
    {
        key: 'today',
        highlight: true,
        dates: new Date(),
    },
    {
        key : 'projecting',
        highlight : {
            color : 'orange',
            fillMode : 'solid',
        },
        dates : onlyProjectDays.value
    },
    {
        key : 'sending',
        highlight : { 
            color : 'red',
            fillMode : 'solid',
        },
        dates : daysWithTicks.value
    }
])
const onDayClick = (evt) => {
    const date = evt.id
    store.dispatch('fetchArchiveDate',{ date })
}

const onlyProjectDays = computed( () => Object.keys(tickDates.value).reduce((acc,datekey) => {
   const item = tickDates.value[datekey] 
   if (item.tick_count == null || item.tick_count == 0) {
     const d = dayjs(datekey)
     acc.push(d.toDate())
   } 
     return acc
},[]) )

const daysWithTicks = computed(() => Object.keys(tickDates.value).reduce((acc,datekey) => {
   const item = tickDates.value[datekey] 
   if (item.tick_count != null || item.tick_count > 0) {
    const d = dayjs(datekey)
    acc.push(d.toDate())
   } 
    return acc
},[]) )
</script>
