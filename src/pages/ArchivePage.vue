<template>
    <f7-page>
        <f7-navbar>
            <f7-nav-left>
                <f7-link href="/home">&lt; {{ t('sidepanel.home') }}</f7-link>
            </f7-nav-left>
            <f7-nav-title> {{ t('archive.archive_title') }} </f7-nav-title>
        </f7-navbar>
        <f7-block class="m-0 p-1">
            <p class="mb-2">{{ t('archive.intro') }}</p>
            <div class="flex flex-col items-center">
                <div class="text-center">{{ t('archive.date_span') }}: {{ selectedSpan }}</div>
                <br />
                <br />
                {{ t('archive.throttle_notice') }} <span class="font-bold text-red-300" v-if="!newClickPossible">{{ t('archive.wait') }}</span><span class="font-bold text-green-300" v-else>{{ t('archive.ready') }}</span>
                <calendar :attributes='attrs' @dayclick="onDayClick">
                    <template #day-popover="{ day, format, masks }">
                        <div class="text-xs text-gray-300 font-semibold text-center">
                            {{ format(day.date, masks.dayPopover) }}
                        </div>
                    </template>
                </calendar>

                <label for="location" class="text-white">{{ t('archive.show_time_span') }}</label>
                <select v-model="showSpan" class="text-black" id="location" name="location">
                    <option value="day">{{ t('archive.day') }}</option>
                    <option value="week">{{ t('archive.week') }}</option>
                    <option value="month">{{ t('archive.month') }}</option>
                    <option value="year">{{ t('archive.year') }}</option>
                </select>


            </div>


            <div class="mx-auto w-11/12" v-if="archiveDate != null">


                <div v-if="loading" class="flex flex-col items-center justify-center mt-3">
                    <f7-preloader class="my-2"></f7-preloader>
                    {{ t('archive.loading_dates') }}
                </div>


                <div v-if="reversedTicks.length > 0 || reversedProjects.length > 0">

                    <div class="flex flex-row justify-around my-1 gap-2">
                        <div class="text-center border border-gray-800 p-1 ">
                            {{ t('archive.ticks_count', { n: ascents.length }) }}
                            <Bar v-if="!loading" :chart-options="{ plugins: { legend: { display: false } } }" :chart-data="data" chart-id="archive_chart_ticks" :width="150" :height="100" />
                        </div>
                        <div class="text-center border border-gray-700 p-1">
                            {{ t('archive.projects_count', { n: projects.length }) }}
                            <Bar v-if="!loading" :chart-options="{ plugins: { legend: { display: false } } }" :chart-data="projectData" chart-id="archive_chart_projs" :width="150" :height="100" />
                        </div>
                    </div>

                    <f7-block-title>{{ t('archive.ticks_title', { n: reversedTicks.length }) }}</f7-block-title>
                    <small>{{ t('archive.weekly_stats_hint') }}</small>
                    <f7-list v-if="reversedTicks.length > 0" problem-list>
                        <f7-list-item @swipeout:deleted="(evt) => onDeleted(tick, j)" @click="openProblem(tick)" swipeout v-for="(tick, index) in reversedTicks" :key="tick.id" link="#">
                            <template #media>
                                <div class="flex flex-col items-center">{{ index + 1 }}.<br /><span class="font-bold">{{ right(tick.problem.tag, 4) }}</span> </div>
                            </template>
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
                                            <!-- A board or personal send has no gym: gymid is NULL by
                                                 design, so reading gym.name here threw and emptied the
                                                 whole day's list. See helpers/tickPlace. -->
                                            <div v-if="placeOf(tick)" class="ps-2">@{{ placeText(tick) }}</div>
                                        </div>
                                        <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                    </div>
                                </div>
                            </template>
                            <template #after>
                                <div class="flex flex-row items-center gap-1">
                                    <div class="flex flex-col items-end">
                                        <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                                        <div class="text-sm">
                                            {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                                        </div>
                                    </div>
                                    <!-- Swiping the row also deletes (below), but nothing on the row
                                         hints that, so this is the one a climber can actually find. -->
                                    <button class="archive-delete-btn" @click.stop="confirmDeleteTick(tick)">
                                        <i class="material-icons" style="font-size: 20px;">delete_outline</i>
                                    </button>
                                </div>
                            </template>
                            <f7-swipeout-actions right>
                                <f7-swipeout-button delete :confirm-text="t('problem.tick_delete_are_you_sure')">{{ t('delete') }}</f7-swipeout-button>
                            </f7-swipeout-actions>
                        </f7-list-item>
                    </f7-list>
                    <f7-block-title>{{ t('archive.tries_projecting', { n: reversedProjects.length }) }}</f7-block-title>
                    <f7-list v-if="reversedProjects.length > 0">
                        <f7-list-item @swipeout:deleted="(evt) => onProjectDeleted(tick, j)" @click="openProblem(tick)" swipeout v-for="(tick, index) in reversedProjects" :key="tick.id" link="#">
                            <template #media>
                                <div class="flex flex-col items-center">{{ index + 1 }}.<br /><span class="font-bold">{{ right(tick.problem.tag, 4) }}</span> </div>
                            </template>
                            <template #title>
                                <div class="flex flex-row">
                                    <span class="px-1 pt-1 text-2xl font-bold w-16">{{ tick.problem.grade.name }}</span>
                                    <div class="flex flex-col">
                                        <div class="flex flex-row">
                                            <div class="rounded-full font-bold text-yellow-400">
                                                {{ t('archive.a_burn') }}
                                            </div>
                                            <!-- A board or personal send has no gym: gymid is NULL by
                                                 design, so reading gym.name here threw and emptied the
                                                 whole day's list. See helpers/tickPlace. -->
                                            <div v-if="placeOf(tick)" class="ps-2">@{{ placeText(tick) }}</div>
                                        </div>
                                        <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
                                    </div>
                                </div>
                            </template>
                            <template #after>
                                <div class="flex flex-row items-center gap-1">
                                    <div class="flex flex-col items-end">
                                        <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                                        <div class="text-sm">
                                            {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                                        </div>
                                    </div>
                                    <button class="archive-delete-btn" @click.stop="confirmDeleteProjectTick(tick)">
                                        <i class="material-icons" style="font-size: 20px;">delete_outline</i>
                                    </button>
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
import { useMutation, useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { mutations } from '@js/mutations'
import { runArchiveDayClick } from '@js/helpers/archiveThrottle.js'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { computed, ref, watch } from 'vue'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'v-calendar/dist/style.css'
import { Calendar, SetupCalendar, DatePicker } from 'v-calendar'
import { f7 } from 'framework7-vue'
import { toaster, alert } from '@js/helpers/notifications.js'
import { tickPlace, tickGradeName } from '@js/helpers/tickPlace.js'
import { right } from '@js/helpers'

import { Bar } from 'vue-chartjs'
const { mutateAsync: deleteProject } = useMutation(mutations.deleteProject())
const { mutateAsync: deleteTick } = useMutation(mutations.deleteTick())

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
const guessed = ref(dayjs.tz.guess())
dayjs.tz.setDefault(guessed.value)
const { t } = useI18n()

/**
 * Where a tick happened — a gym for an ordinary route, the board for a board
 * or personal send, nothing when neither is known.
 */
const placeOf = (tick) => tickPlace(tick?.problem)

const placeText = (tick) => {
  const place = placeOf(tick)
  if (!place) return ''
  if (place.type === 'gym') return place.name

  const name = t('board.name_' + place.board)
  // 0° is a real setting, so only a genuinely absent angle is omitted.
  return place.angle == null ? name : `${name} ${place.angle}°`
}
const loading = ref(true)

const showSpan = ref('day')
// Initialized straight to today rather than in onMounted: the query below is
// enabled as soon as this has a value, so starting it at [] (a falsy-looking
// but truthy array — needs() would never gate it) fired a request for an
// empty span before anything set the real dates.
const selectedSpan = ref([dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")])

// onDayClick below changes selectedSpan AND explicitly calls refetch (see
// runArchiveDayClick) — the key change alone is not enough, since a
// month/year span repeats across different days and a literal re-click
// repeats it exactly, neither of which TanStack sees as "new".
const { data: archiveDayData, isFetching: archiveDayFetching, refetch: refetchArchiveDay } = useQuery(queries.archiveDay(selectedSpan))

// Only drives the spinner. The click-throttle's own reopening is handled
// in onDayClick via runArchiveDayClick, not here — see its comment for why:
// isFetching does not reliably transition for every click.
watch(archiveDayFetching, (fetching) => {
    loading.value = fetching
})
const ascentsByGrade = computed(() => {
    if (archiveDate.value == null || archiveDate.value.ticks == null) {
        return []
    }
    // Take the ticks from the current state
    return archiveDate.value.ticks.reduce((acc, item) => {
        const grade = tickGradeName(item.problem) ?? t('problem.no_grade')
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
        const grade = tickGradeName(item.problem) ?? t('problem.no_grade')
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


const { data: archiveDatesData } = useQuery(queries.archiveDates())
const tickDates = computed(() => archiveDatesData.value?.dates ?? {})
// The query is already keyed by selectedSpan, so its data IS the current
// span's details — no separate per-span cache to look up here any more.
const archiveDate = computed(() => archiveDayData.value ?? {})
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
const onDayClick = async (evt) => {
    if (!newClickPossible.value) {
        // Deny click when loading is in progress
        return
    }
    newClickPossible.value = false
    // Day click depends on the calendar span.
    // day selectes days, weeks or months
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
    // Two different days in the same month/year span to the same [start,end]
    // pair, and re-clicking the same day repeats the exact span — either way
    // queries.archiveDay's key does not change, so TanStack would serve the
    // cached entry within its 30s staleTime and skip the fetch entirely.
    // runArchiveDayClick calls refetch() unconditionally, so this always
    // issues a real request and always reopens the throttle afterwards.
    await runArchiveDayClick(refetchArchiveDay)
    newClickPossible.value = true
}

const reversedTicks = computed(() => [...(archiveDate.value.ticks || [])].reverse())
const reversedProjects = computed(() => [...(archiveDate.value.tries || [])].reverse())
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
const openProblem = (tick) => {
    if (tick.problem?.id) {
        f7.views.main.router.navigate('/problem/' + tick.problem.id + '/popup', {
            props: { problem: tick.problem },
        })
    }
}
// deleteTick/deleteProject only invalidate the TanStack Query cache entries
// listed in queryKeyNames.js (feed, badges, rankings...) — archive-day isn't
// among them, since its key is per-span and the invalidation helper has no
// way to know which span the deleted tick belonged to. Without this explicit
// refetch the row stayed on screen until an unrelated re-render, looking like
// the delete silently did nothing.
const refreshArchiveDate = async () => {
    // selectedSpan hasn't changed, so the query key hasn't either — ask it
    // to refetch directly instead of waiting for a key change that isn't
    // coming.
    await refetchArchiveDay()
}
const onProjectDeleted = async (tick) => {
    const resp = await deleteProject(tick.id)
    toaster(resp.message)
    await refreshArchiveDate()
}
const onDeleted = async (tick) => {
    const resp = await deleteTick(tick.id)
    toaster(resp.message)
    await refreshArchiveDate()
}
// The swipeout gesture (f7-swipeout-button below) already deletes, but
// nothing on the row hints it's there — no icon, no affordance. This is the
// same action behind a control that's actually discoverable, confirmed the
// same way the swipeout's own confirm-text already does.
const confirmDeleteTick = (tick) => {
    f7.dialog.confirm(t('problem.tick_delete_are_you_sure'), () => onDeleted(tick))
}
const confirmDeleteProjectTick = (tick) => {
    f7.dialog.confirm(t('problem.tick_delete_are_you_sure'), () => onProjectDeleted(tick))
}
const daysWithTicks = computed(() => Object.keys(tickDates.value).reduce((acc, datekey) => {
    const item = tickDates.value[datekey]
    const d = dayjs(datekey)
    acc.push(d.toDate())
    return acc
}, []))
</script>
<style scoped>
.archive-delete-btn {
  border: 0;
  background: none;
  color: var(--p-text-dim);
  padding: 0.25rem;
  line-height: 1;
}
.archive-delete-btn:hover,
.archive-delete-btn:active {
  color: var(--p-danger);
}
</style>
