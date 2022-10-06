<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link href="/">&lt; home</f7-link>
            </f7-nav-left>
            <f7-nav-title> {{ t('archive.archive_title') }} </f7-nav-title>
        </f7-navbar>
        <f7-block>
            <div class="flex flex-col items-center">
                <div class="flex flex-col">
                    <div class="flex flex-row gap-2">
                        <div class="rounded-lg w-4 h-4 bg-red-500"></div>
                        <div>Day with activity</div>
                    </div>
                    <!--
                <div class="flex flex-row gap-2">
                    <div class="rounded-lg w-4 h-4 bg-orange-500"></div>
                    <div>Day with tries, no ticks</div>
                </div>
                -->
                </div>
                <hr />
                <calendar :attributes='attrs' @dayclick="onDayClick">
                    <template #day-popover="{ day, format, masks }">
                        <div class="text-xs text-gray-300 font-semibold text-center">
                            {{ format(day.date, masks.dayPopover) }}
                        </div>
                    </template>
                </calendar>
                Click a date to see the details
            </div>

            <div class="mx-auto w-11/12" v-if="archiveDate != null">

                <div class="text-center" v-html="t('problem.myticks_intro')"></div>
                <div v-if="reversedTicks.length > 0 || reversedProjects.length > 0">
                    <f7-block-title>Ticks</f7-block-title>
                    <f7-list v-if="reversedTicks.length > 0">
                        <f7-list-item @swipeout:deleted="(evt) => onDeleted(tick, j)" swipeout v-for="(tick, index) in reversedTicks" :key="tick.id">
                            <template #media> {{ index + 1 }}. </template>
                            <template #title>
                                <div class="flex flex-col">
                                    <div v-if="tick.tries == 1" class="rounded-full font-bold text-yellow-400">
                                        {{ t('flash') }}
                                    </div>
                                    <div v-else class="rounded-full font-bold  text-red-400">
                                        {{ t('redpoint') }}
                                    </div>
                                    <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                </div>
                            </template>
                            <template #after>
                                <div class="flex flex-col">
                                    <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                                    <div class="text-sm">
                                        {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                                    </div>
                                </div>
                            </template>
                            <f7-swipeout-actions right>
                                <f7-swipeout-button delete :confirm-text="t('problem.tick_delete_are_you_sure')">{{ t('delete') }}</f7-swipeout-button>
                            </f7-swipeout-actions>
                        </f7-list-item>
                    </f7-list>
                    <f7-block-title>Tries / Projecting</f7-block-title>
                    <f7-list v-if="reversedProjects.length > 0">
                        <f7-list-item @swipeout:deleted="(evt) => onProjectDeleted(tick, j)" swipeout v-for="(tick, index) in reversedProjects" :key="tick.id">
                            <template #media> {{ index + 1 }}. </template>
                            <template #title>
                                <div class="flex flex-col">
                                    <div class="rounded-full font-bold text-yellow-400">
                                        {{ t('a burn') }}
                                    </div>
                                    <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                </div>
                            </template>
                            <template #after>
                                <div class="flex flex-col">
                                    <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                                    <div class="text-sm">
                                        {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                                    </div>
                                </div>
                            </template>
                            <f7-swipeout-actions right>
                                <f7-swipeout-button delete :confirm-text="t('problem.tick_delete_are_you_sure')">{{ t('delete') }}</f7-swipeout-button>
                            </f7-swipeout-actions>
                        </f7-list-item>
                    </f7-list>
                </div>
                <div v-else class="my-2 text-center font-bold text-orange">
                    {{ t('problem.you_have_no_ticks') }}
                </div>

            </div>
        </f7-block>
    </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { f7, useStore } from 'framework7-vue'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { computed, ref } from 'vue'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'v-calendar/dist/style.css'
import { Calendar, SetupCalendar, DatePicker } from 'v-calendar'
import { toaster, alert } from '@js/helpers/notifications.js'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
const guessed = ref(dayjs.tz.guess())
dayjs.tz.setDefault(guessed.value)
const { t } = useI18n()
const selectedDay = ref(null)
store.dispatch("getTickDates")
const tickDates = useStore('tickDates')
const archive = useStore('archive')
const archiveDate = computed(() => {
    if (archive.value.dateDetails[selectedDay.value]) {
        return archive.value.dateDetails[selectedDay.value]
    }
    return t('No training data available for this day')
})
const attrs = computed(() => [
    {
        key: 'today',
        highlight: true,
        dates: new Date(),
    },
    {
        key: 'sending',
        highlight: {
            color: 'red',
            fillMode: 'solid',
        },
        dates: daysWithTicks.value
    }
])
const onDayClick = (evt) => {
    const date = evt.id
    selectedDay.value = date
    store.dispatch('fetchArchiveDate', { date })
}

const reversedTicks = computed(() => archiveDate.value.ticks?.reverse() || [])

const reversedProjects = computed(() => archiveDate.value.tries?.reverse() || [])
/*
const onlyProjectDays = computed(() => Object.keys(tickDates.value).reduce((acc, datekey) => {
    const item = tickDates.value[datekey]
    if (item.tick_count == null || item.tick_count == 0) {
        const d = dayjs(datekey)
        acc.push(d.toDate())
    }
    return acc
}, []))

const daysWithTicks = computed(() => Object.keys(tickDates.value).reduce((acc, datekey) => {
    const item = tickDates.value[datekey]
    if (item.tick_count != null || item.tick_count > 0) {
        const d = dayjs(datekey)
        acc.push(d.toDate())
    }
    return acc
}, []))
*/
const onProjectDeleted = (tick) => {
  store.dispatch('deleteProject', tick.id).then((resp) => {
    toaster(resp.message)
  })
}
const onDeleted = (tick) => {
  store.dispatch('deleteTick', tick.id).then((resp) => {
    toaster(resp.message)
  })
}
const daysWithTicks = computed(() => Object.keys(tickDates.value).reduce((acc, datekey) => {
    const item = tickDates.value[datekey]
    const d = dayjs(datekey)
    acc.push(d.toDate())
    return acc
}, []))
</script>
