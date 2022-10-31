<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link href="/home">&lt; home</f7-link>
            </f7-nav-left>
            <f7-nav-title> {{ t('archive.archive_title') }} </f7-nav-title>
        </f7-navbar>
        <f7-block class="m-0 p-1">
            <p class="mb-2">What is this sorcery? By default this will show your daily
                ticks. But if you choose weekly/mohthly/yearly span and click
                a day, it will fetch the ticks accordingly and populate the data.</p>
            <div class="flex flex-col items-center">
                    <div class="text-center">date span: {{ selectedSpan}}</div>
<br />
<br />
The chart loading is throttled, so there is a 2 second wait before you
can click again. <span class="font-bold text-red-300" v-if="!newClickPossible">wait</span><span  class="font-bold text-green-300" v-else>ready</span>
                <calendar :attributes='attrs' @dayclick="onDayClick">
                    <template #day-popover="{ day, format, masks }">
                        <div class="text-xs text-gray-300 font-semibold text-center">
                            {{ format(day.date, masks.dayPopover) }}
                        </div>
                    </template>
                </calendar>

                <label for="location" class="text-white">Show time span</label>
                <select v-model="showSpan" class="text-black" id="location" name="location">
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>


            </div>
            

                <div class="mx-auto w-11/12" v-if="archiveDate != null">


                    <div v-if="loading" class="flex flex-col items-center justify-center mt-3">
                        <f7-preloader class="my-2"></f7-preloader>
                        Loading date(s)...
                    </div>


                    <div v-if="reversedTicks.length > 0 || reversedProjects.length > 0">

                        <div class="flex flex-row justify-around my-1 gap-2">
                            <div class="text-center border border-gray-800 p-1 ">
                                {{ascents.length}} tick(s)
                                <Bar v-if="!loading" :chart-options="{plugins : { legend: { display: false } }}" :chart-data="data" chart-id="archive_chart_ticks" :width="150" :height="100" />
                            </div>
                            <div class="text-center border border-gray-700 p-1">
                                {{projects.length}} project(s)
                                <Bar v-if="!loading" :chart-options="{plugins : { legend: { display: false } }}" :chart-data="projectData" chart-id="archive_chart_projs" :width="150" :height="100" />
                            </div>
                        </div>

                        <f7-block-title>Ticks ({{ reversedTicks.length }})</f7-block-title>
                        <small>Want to see your weekly stats? Just choose week as a time span and click any
                            day on the weekday you want to show the data on.</small>
                        <f7-list v-if="reversedTicks.length > 0" problem-list>
                            <f7-list-item @swipeout:deleted="(evt) => onDeleted(tick, j)" swipeout v-for="(tick, index) in reversedTicks" :key="tick.id">
                                <template #media> <div class="flex flex-col items-center">{{ index + 1 }}.<br /><span class="font-bold">{{ right(tick.problem.tag,4) }}</span> </div></template>
                                <template #title>
                                    <div class="flex flex-row">
                                        <span class="px-1 pt-1 text-2xl font-bold w-16">{{ tick.problem.grade.name }}</span>
                                        <div class="flex flex-col">
                                            <div class="flex">
                                                <div v-if="tick.tries == 1" class="rounded-full font-bold text-yellow-400  ">
                                                    {{ t('flash') }}
                                                </div>
                                                <div v-else class="rounded-full font-bold  text-red-400  ">
                                                    {{ t('redpoint') }}
                                                </div>
                                                <div class="ps-2">@{{ tick.problem.gym.name }}</div>
                                            </div>
                                            <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                        </div>
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
                        <f7-block-title>Tries / Projecting ({{ reversedProjects.length}})</f7-block-title>
                        <f7-list v-if="reversedProjects.length > 0">
                            <f7-list-item @swipeout:deleted="(evt) => onProjectDeleted(tick, j)" swipeout v-for="(tick, index) in reversedProjects" :key="tick.id">
                                <template #media> <div class="flex flex-col items-center">{{ index + 1 }}.<br /><span class="font-bold">{{ right(tick.problem.tag,4) }}</span> </div></template>
                                <template #title>
                                    <div class="flex flex-row">
                                        <span class="px-1 pt-1 text-2xl font-bold w-16">{{ tick.problem.grade.name }}</span>
                                        <div class="flex flex-col">
                                            <div class="flex flex-row">
                                                <div class="rounded-full font-bold text-yellow-400">
                                                    {{ t('a burn') }}
                                                </div>
                                                <div class="ps-2">@{{ tick.problem.gym.name }}</div>
                                            </div>
                                            <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                        </div>
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
                        {{ t('archive.you_have_no_ticks') }}
                    </div>
                </div>

            
        </f7-block>
    </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { computed, ref, onMounted } from 'vue'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'v-calendar/dist/style.css'
import { Calendar, SetupCalendar, DatePicker } from 'v-calendar'
import { toaster, alert } from '@js/helpers/notifications.js'
import { right } from '@js/helpers'

import { Bar } from 'vue-chartjs'
const store = useStore()

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
const guessed = ref(dayjs.tz.guess())
dayjs.tz.setDefault(guessed.value)
const { t } = useI18n()
const loading = ref(true)

onMounted(() => {
    selectedSpan.value = [dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")]
    loading.value = false
})
const showSpan = ref('day')
const selectedSpan = ref([])
const ascentsByGrade = computed(() => {
    if (archiveDate.value == null || archiveDate.value.ticks == null) {
        return []
    }
    // Take the ticks from the current state
    return archiveDate.value.ticks.reduce((acc, item) => {
        const grade = item.problem.grade.name
        if (acc[grade] == null) {
            acc[grade] = 1
        } else {
            acc[grade] += 1
        }
        return acc
    }, {})

})
const projectsByGrade = computed(() => {
    if (archiveDate.value == null || archiveDate.value.tries == null) {
        return []
    }
    // Take the ticks from the current state
    return archiveDate.value.tries.reduce((acc, item) => {
        const grade = item.problem.grade.name
        if (acc[grade] == null) {
            acc[grade] = 1
        } else {
            acc[grade] += 1
        }
        return acc
    }, {})

})
const labels = computed(() => Object.keys(ascentsByGrade.value).sort((a, b) => a.localeCompare(b)))
const ascents = computed(() => Object.keys(ascentsByGrade.value).sort((a, b) => a.localeCompare(b)).map(key => ascentsByGrade.value[key]))
const projectLabels = computed(() => Object.keys(projectsByGrade.value).sort((a, b) => a.localeCompare(b)))
const projects = computed(() => Object.keys(projectsByGrade.value).sort((a, b) => a.localeCompare(b)).map(key => projectsByGrade.value[key]))
const projectData = computed(() => ({
    labels: projectLabels.value,
    datasets: [
        {
            data: projects.value,
            label: t("amount"),
            backgroundColor: ["#97B0C4"],
        },
    ],
}))

const data = computed(() => ({
    labels: labels.value,
    datasets: [
        {
            data: ascents.value,
            label: t("amount"),
            backgroundColor: ["#97B0C4"],
        },
    ],
}))


const tickDates = computed(() => store.state.archive.dates)
const dateDetails = computed(() => store.state.archive.dateDetails)
store.dispatch("getTickDates")
const archiveDate = computed(() => {
    if (Array.isArray(selectedSpan.value)) {
        const keyed = selectedSpan.value.join(",")
        if (dateDetails.value[keyed]) {
            return dateDetails.value[keyed]
        }
    }
    return {}
})
const newClickPossible = ref(true)
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
    if (!newClickPossible.value) {
        // Deny click when loading is in progress
        return
    }
    newClickPossible.value = false
    // Day click depends on the calendar span.
    // day selectes days, weeks or months
    loading.value = true
    const date = evt.id
    if (showSpan.value == 'day') {
        selectedSpan.value = [date, date]
    } else if (showSpan.value == 'week') {
        selectedSpan.value = [dayjs(date).startOf('week').format("YYYY-MM-DD"), dayjs(date).endOf('week').format("YYYY-MM-DD")]
    } else if (showSpan.value == 'month') {
        selectedSpan.value = [dayjs(date).startOf('month').format("YYYY-MM-DD"), dayjs(date).endOf('month').format("YYYY-MM-DD")]
    } else if (showSpan.value == 'year') {
        selectedSpan.value = [dayjs(date).startOf('year').format("YYYY-MM-DD"), dayjs(date).endOf('year').format("YYYY-MM-DD")]
    } else {
        console.log("No idea what to do")
    }
    console.log("span", selectedSpan)
    store.dispatch('fetchArchiveDate', { span: selectedSpan.value })
        .then(() => {
            loading.value = false
            setTimeout(() => {newClickPossible.value=true}, 2000)
        })
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
