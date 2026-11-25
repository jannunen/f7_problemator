<template>
  <div v-if="comp != null" class="ce">

    <!-- Reference, not the task: what the competition is and when. The same
         shape as the header a climber saw before registering. -->
    <header class="ce-head">
      <h1 class="ce-head__name">{{ comp.name }}</h1>
      <div class="ce-chips">
        <p-badge class="ce-chip ce-chip--type">{{ t('comps.' + comp.tyyppi) }}</p-badge>
        <p-badge v-if="comp.tyyppi == 'fixed_points_best_n' && comp.nbest" class="ce-chip">{{ t('comps.best_n_count', { n: comp.nbest }) }}</p-badge>
      </div>
      <dl class="ce-facts">
        <dt>{{ t('comps.location') }}</dt>
        <dd>{{ comp.location ?? t('comps.location_not_set') }}</dd>
        <dt>{{ t('comps.venue_opens') }}</dt>
        <dd>{{ toLocalTime(comp.compdate) }}</dd>
        <dt>{{ t('comps.timespan') }}</dt>
        <dd>{{ windowLabel(comp.timespan_start, comp.timespan_end, toLocalTime, t('comps.no_time_limit')) }}</dd>
      </dl>
      <dl class="ce-counts">
        <div class="ce-count">
          <dt>{{ t('comps.problems') }}</dt>
          <dd>{{ sortedProblems.length }}</dd>
        </div>
        <div class="ce-count">
          <dt>{{ t('comps.participants') }}</dt>
          <dd>{{ comp.paidregistrations?.length }}</dd>
        </div>
        <div class="ce-count ce-count--id">
          <dt>ID</dt>
          <dd>{{ comp.id }}</dd>
        </div>
      </dl>
    </header>

    <div v-if="sortedProblems.length == 0" class="p-banner p-banner--info ce-notice" data-test="comp-no-problems">
      <span class="material-icons p-banner__icon" aria-hidden="true">info</span>
      <div class="p-banner__content">{{ t('comps.no_problems_yet') }}</div>
    </div>

    <f7-toolbar tabbar class="ce-tabbar">
      <f7-link tab-link="#ce-tab-entry" tab-link-active>{{ t('comps.point_entry') }}</f7-link>
      <f7-link tab-link="#ce-tab-results">{{ t('comps.open_results') }}</f7-link>
      <f7-link tab-link="#ce-tab-routes">{{ t('comps.route_details') }}</f7-link>
    </f7-toolbar>
    <f7-tabs>
      <f7-tab id="ce-tab-entry" tab-active>

      <div v-if="compOngoing " class="ce-live">

        <!-- Stays under the navbar while the list scrolls: the clock and the
             tally are what a climber looks up for between attempts. -->
        <div class="ce-bar" data-test="comp-bar">
          <div class="ce-bar__time" :class="{ 'ce-bar__time--urgent': timeLeft?.urgent }" role="timer">
            <i class="material-icons" aria-hidden="true">timer</i>
            <template v-if="timeLeft">
              <span v-if="timeLeft.days > 0" class="ce-bar__days">{{ t('comps.days_short', { n: timeLeft.days }) }}</span>
              <span class="ce-bar__clock">{{ timeLeft.clock }}</span>
              <span class="ce-bar__unit">{{ t('comps.time_left') }}</span>
            </template>
            <span v-else class="ce-bar__nolimit">{{ t('comps.no_time_limit') }}</span>
          </div>
          <div class="ce-bar__ticks">
            <span class="ce-bar__count">{{ tickCount }}</span><span class="ce-bar__total">/{{ sortedProblems.length }}</span>
            <span class="ce-bar__unit">{{ t('comps.ticked') }}</span>
          </div>
        </div>

        <template v-if="sortedProblems.length > 0">
          <p v-if="!isLadderType" class="ce-hint">{{ t('comps.delete_ascent_hint') }}</p>
          <p v-else class="ce-hint">{{ t('comps.delete_ascent_hint_swipe') }}</p>
          <p v-if="comp.tyyppi == 'sport'" class="ce-hint">{{ t('comps.sport_points_hint') }}</p>
        </template>
        <f7-list class="ce-rows">
          <f7-list-item swipeout v-for="prob in sortedProblems" :key="prob.id" class="ce-row" :class="[ladderRowClass, { 'ce-row--ticked': isTicked(prob.id) }]">
            <f7-swipeout-actions right>
              <f7-swipeout-button color="red" close @click="() => onDeleted(prob.id)" :confirm-text="t('problem.tick_delete_are_you_sure')">{{ t('comps.delete_ascent') }}</f7-swipeout-button>
            </f7-swipeout-actions>
            <template #media>
              <div class="ce-id">
                <span class="ce-id__num">{{ prob.pivot.num }}</span>
                <span class="ce-id__swatch" :style="getStyles(prob)" aria-hidden="true"></span>
                <span class="ce-id__tag">{{ right(prob?.tag,4) }}</span>
              </div>
            </template>
            <template #title>
              <div v-if="comp.tyyppi == 'variable_points'" class="ce-entry">
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi == 'predefined_plus_flashcomp'" class="ce-entry ce-entry--points">
                <div class="ce-points" :title="t('results.points')">
                  {{ getPointsPerProblem(prob.pivot.num) }}
                </div>
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi=='checkpoint_points'" class="ce-entry">
                <checkpoint-ladder
                  :problem="prob"
                  :state="ladders.stateFor(prob)"
                  :disabled="!compOngoing || !!ladders.lockedReason.value"
                  :locked-reason="ladders.lockedReason.value"
                  :saving="ladders.isSaving(prob.id)"
                  :error="ladders.errors.value[prob.id] ?? null"
                  @select="(r) => ladders.act(prob, 'select', r)"
                  @try="() => ladders.act(prob, 'try')"
                  @reached="() => ladders.act(prob, 'reached')"
                  @top="() => ladders.act(prob, 'top')"
                  @undo="() => ladders.act(prob, 'undo')"
                  @edit="(rung, count) => ladders.act(prob, 'edit', { rung, count })"
                  @unreach="(rung) => ladders.act(prob, 'unreach', rung)"
                  @retry="() => ladders.act(prob, 'retry')"
                  @clear="() => ladders.act(prob, 'clear')"
                />
              </div>
              <div v-else-if="comp.tyyppi=='fixed_points_best_n'" class="ce-entry ce-entry--points">
                <div class="ce-points" :title="t('results.points')">
                  {{ prob.pivot.max_points }}
                </div>
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi=='sport'" class="ce-entry">
                <input :value="sportPointsDisplay(prob.id)" @change="(e) => onChangeSportPoints(prob.id, e)" class="p-input ce-input" :placeholder="t('comps.enter_points')" type="text" />
              </div>
              <div v-else-if="isZoneLadderType" class="ce-entry">
                <checkpoint-ladder
                  :problem="prob"
                  :state="ladders.stateFor(prob)"
                  :options="zoneLadderOptions"
                  :disabled="!compOngoing || !!ladders.lockedReason.value"
                  :locked-reason="ladders.lockedReason.value"
                  :saving="ladders.isSaving(prob.id)"
                  :error="ladders.errors.value[prob.id] ?? null"
                  @select="(r) => ladders.act(prob, 'select', r)"
                  @try="() => ladders.act(prob, 'try')"
                  @reached="() => ladders.act(prob, 'reached')"
                  @top="() => ladders.act(prob, 'top')"
                  @undo="() => ladders.act(prob, 'undo')"
                  @edit="(rung, count) => ladders.act(prob, 'edit', { rung, count })"
                  @unreach="(rung) => ladders.act(prob, 'unreach', rung)"
                  @retry="() => ladders.act(prob, 'retry')"
                  @clear="() => ladders.act(prob, 'clear')"
                />
              </div>
              <div v-else class="ce-entry ce-entry--unsupported">
                {{ t('comps.type_not_supported') }}
              </div>
            </template>
            <template #after>
              <p-button
                v-if="!isLadderType"
                :disabled="busy[prob.id]"
                @click="() => onSave(prob.id)"
                class="p-btn--primary ce-save"
              >{{ busy[prob.id] ? t('global.saving') : t('global.save') }}</p-button>
              <span v-if="isTicked(prob.id)" class="ce-check"><i class="material-icons" aria-hidden="true">check_circle</i><span class="sr-only">{{ t('comps.ticked') }}</span></span>
              <span v-else class="ce-check">&nbsp;</span>
              <button
                v-if="!isLadderType && isTicked(prob.id)"
                type="button"
                data-test="delete-ascent"
                class="ce-trash"
                :aria-label="t('comps.delete_ascent')"
                :title="t('comps.delete_ascent')"
                @click="() => confirmDelete(prob.id)"
              ><i class="icon f7-icons" style="font-size: 22px;" aria-hidden="true">trash</i></button>
            </template>
          </f7-list-item>
        </f7-list>
      </div>
      <div v-else class="p-banner p-banner--warning ce-notice" data-test="comp-not-running">
        <span class="material-icons p-banner__icon" aria-hidden="true">schedule</span>
        <div class="p-banner__content">{{ t('comps.the_comp_has_not_started_yet') }}</div>
      </div>
      </f7-tab>

      <f7-tab id="ce-tab-results" class="ce-tab-results">
        <f7-block v-if="compResults != null">
          <show-results :type="comp.tyyppi" :last-update="lastResultUpdate" :results="compResults.results" />
        </f7-block>
      </f7-tab>

      <f7-tab id="ce-tab-routes" class="ce-tab-routes">
        <f7-block>
          <points-per-route
            v-if="comp.tyyppi == 'variable_points'"
            :last-update="lastUpdate"
            :points-per-route="comp.points_per_route"
            :topped-ids="toppedIds"
            :tries-by-id="tries"
          />
          <ul v-else class="ce-route-list" data-test="route-details-list">
            <li v-for="prob in sortedProblems" :key="prob.id" class="ce-route-row">
              <div class="ce-route-row__top">
                <div class="ce-id">
                  <span class="ce-id__num">{{ prob.pivot.num }}</span>
                  <span class="ce-id__swatch" :style="getStyles(prob)" aria-hidden="true"></span>
                  <span class="ce-id__tag">{{ right(prob?.tag,4) }}</span>
                </div>
                <div class="ce-route-row__facts">
                  <span v-if="prob.grade?.name" class="ce-route-row__fact ce-route-row__grade">{{ prob.grade.name }}</span>
                  <span v-if="prob.colour?.name" class="ce-route-row__fact">{{ prob.colour.name }}</span>
                  <span v-if="prob.wall?.wallchar" class="ce-route-row__fact">{{ prob.wall.wallchar }}<template v-if="prob.wall.walldesc"> · {{ prob.wall.walldesc }}</template></span>
                </div>
              </div>
              <div v-if="routeStatsByProblemId[prob.id]" class="ce-route-row__stats" data-test="route-stats">
                <span class="ce-route-row__stat">{{ t('comps.route_stats_climbed', { climbed: routeStatsByProblemId[prob.id].totalAscents, total: routeStatsByProblemId[prob.id].totalParticipants }) }}</span>
                <span v-if="routeStatsByProblemId[prob.id].overallPercent != null" class="ce-route-row__stat">{{ t('comps.route_stats_of_everyone', { percent: routeStatsByProblemId[prob.id].overallPercent }) }}</span>
                <span v-if="routeStatsByProblemId[prob.id].categoryPercent != null" class="ce-route-row__stat">{{ t('comps.route_stats_of_your_category', { percent: routeStatsByProblemId[prob.id].categoryPercent }) }}</span>
              </div>
            </li>
          </ul>
          <div v-if="sortedProblems.length == 0" class="p-banner p-banner--info ce-notice">
            <span class="material-icons p-banner__icon" aria-hidden="true">info</span>
            <div class="p-banner__content">{{ t('comps.no_problems_yet') }}</div>
          </div>
        </f7-block>
      </f7-tab>
    </f7-tabs>
    <div v-if="errors" class="p-banner p-banner--error ce-notice" role="alert">{{ errors }}</div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { mutations } from '@js/mutations.js'
import { useClimberStore } from '@js/stores/climber.store.js'
import { f7 } from 'framework7-vue'

import { onUnmounted, watch, computed, ref } from 'vue'
import PButton from '@components/PButton.vue'
import { right } from '@js/helpers'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import PBadge from '@components/PBadge.vue'
import PointsPerRoute from './PointsPerRoute.vue'
import ShowResults from './ShowResults.vue'
import { webendpoint } from '@js/api.js'
import CheckpointLadder from './CheckpointLadder.vue'
import { useCheckpointLadders } from '@js/useCheckpointLadders.js'
import { TRIES_AND_BONUS_TYPES } from '@helpers/checkpoints.js'

import {  toaster } from '@helpers/notifications.js'
import { compTickTries, parseSportPoints } from '@helpers/compTries.js'
import { toLocalTime } from '@helpers/component.helpers'
import { isCompRunning, msUntilEnd, windowLabel } from '@helpers/compWindow'
import { countdown } from '@helpers/compCountdown.js'
import { handleValidationErrors } from '@helpers'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps({
  comp: Object,
})

const getPointsPerProblem = (num) => {
  if (pointRules.value == null) {
    return "Points not set at all" 
  }
  // Find the rule for the problem if exists..
  const rule = pointRules.value.points_for_route.find(x => x.route_number == num)
  if (rule == null) {
    // Check for "other" rule
    const otherrule = pointRules.value.points_for_route.find(x => x.route_number == "other")
    if (otherrule != null) {
      return otherrule.points
    }
    return "Points not set for this problem"
  }
  return rule.points
}
const climberStore = useClimberStore()
const { mutateAsync: saveCheckpointMutate } = useMutation(mutations.saveCheckpoint())
const { mutateAsync: deleteCheckpointMutate } = useMutation(mutations.deleteCheckpoint())
const { mutateAsync: getPointsPerRouteMutate } = useMutation(mutations.getPointsPerRoute())
const { mutateAsync: saveTickMutate } = useMutation(mutations.saveTick())
const { mutateAsync: deleteTickByProblemMutate } = useMutation(mutations.deleteTickByProblem())
const pointRules = computed(() => {
  const comp = props.comp
  if (comp.pointsharingobj == null) {
    return null
  }
  return comp.pointsharingobj
})
const isTicked = (pid) => {
  // check this against comp ticks
  const comp = props.comp
  if (comp == null) {
    return false
  }
  const tick = comp.userticks[pid]
  return tick != null
}

// Route ids the climber has already topped in this comp (the preview only applies to the rest).
const toppedIds = computed(() => Object.keys(props.comp?.userticks || {}).map(Number))
const isTriesAndBonusType = computed(() => TRIES_AND_BONUS_TYPES.includes(props.comp.tyyppi))
const busy = ref({})
// Zones/bonus + top on a ladder, saved like checkpoint_points': a zone or
// bonus goes to the comp's checkpoint results, only the Top is a real tick.
// Rungs below the top, per type (the backend counts them the same way).
const ZONE_COUNTS = { ifsc_2024_bouldering: 2, ifsc_2018_bouldering: 1, traditional: 1, flashcomp: 1 }
const isZoneLadderType = computed(() => ZONE_COUNTS[props.comp.tyyppi] != null)
const isLadderType = computed(() => props.comp.tyyppi == 'checkpoint_points' || isZoneLadderType.value)
const zoneLadderOptions = computed(() => {
  if (props.comp.tyyppi == 'ifsc_2024_bouldering') {
    return [
      { label: t('comps.low_zone'), value: 1, points: 5 },
      { label: t('comps.high_zone'), value: 2, points: 10 },
      { label: t('comps.top'), value: 'top', points: 25 },
    ]
  }
  // flashcomp's points depend on the tries taken, so its rungs show none.
  const flash = props.comp.tyyppi == 'flashcomp'
  return [
    { label: t('comps.bonus'), value: 1, points: flash ? null : 3 },
    { label: t('comps.top'), value: 'top', points: flash ? null : 25 },
  ]
})
// A ladder takes the row's spare width (see the styles at the end of this file).
const ladderRowClass = computed(() => ({ 'comp-row--ladder': isLadderType.value }))
const errors = ref("")
dayjs.extend(duration)
dayjs.extend(isBetween)
const { t } = useI18n()
const compResultsQuery = useQuery({
  ...queries.compResults(() => props.comp.id),
  refetchInterval: 45 * 1000,
})
const compResults = computed(() => compResultsQuery.data.value ?? null)
const climber = computed(() => climberStore.climber)

// This climber's own entry in the comp (pivot.serieid is their category) -
// sortedProblems' sport-type filter below already looked this up inline;
// pulled out here so the route-stats percentages can use it too.
const compClimber = computed(() => props.comp.paidregistrations?.find(x => x.id == climber.value?.id) ?? null)

const routeStatsQuery = useQuery({
  ...queries.compRouteStats(() => props.comp.id),
})
const routeStats = computed(() => routeStatsQuery.data.value ?? null)

// "x/y climbed" plus both percentages, keyed by problem id so the template
// does a plain lookup instead of recomputing per row per render. Missing
// stats (not loaded yet) and zero-sized denominators all read as "no data"
// rather than NaN% or a divide-by-zero.
const routeStatsByProblemId = computed(() => {
  if (routeStats.value == null) {
    return {}
  }
  const totalParticipants = routeStats.value.total_participants ?? 0
  const categoryId = compClimber.value?.pivot?.serieid
  const categoryParticipants = categoryId != null ? (routeStats.value.participants_by_category?.[categoryId] ?? 0) : null
  const byProblemId = {}
  for (const [problemId, stats] of Object.entries(routeStats.value.problems ?? {})) {
    const totalAscents = stats.total_ascents ?? 0
    const categoryAscents = categoryId != null ? (stats.ascents_by_category?.[categoryId] ?? 0) : null
    byProblemId[problemId] = {
      totalAscents,
      totalParticipants,
      overallPercent: totalParticipants > 0 ? Math.round((totalAscents / totalParticipants) * 100) : null,
      categoryPercent: categoryParticipants > 0 ? Math.round((categoryAscents / categoryParticipants) * 100) : null,
    }
  }
  return byProblemId
})

// Competition payment: builds the real payment URL, but nothing in the
// template calls this yet — not wired to a button or shown conditionally on
// isPaymentForced/isPaidAndPriceIsSet. Left in place rather than removed so
// the feature can be finished deliberately instead of rebuilt from scratch.
// eslint-disable-next-line no-unused-vars
const openPaymentWindow = () => {
  const link = document.createElement("a")
  link.href = `${webendpoint}/comps/${props.comp.id}/contender/${climber.value.id}/payment`
  link.target = "_blank"
  link.click()
}
const onChangeSportPoints = (pid, e) => {
  if (tries.value[pid] == null) {
    tries.value[pid] = { tries: 1, sport_points: 0 }
  }
  tries.value[pid].sport_points = e.target.value
}
// A saved TOP is stored (and returned by the backend) as 1000, same as the
// results table already shows it — the entry field should read the same
// way rather than showing the raw number back at the climber.
const sportPointsDisplay = (pid) => {
  const value = tries.value[pid]?.sport_points
  return Number(value) === 1000 ? 'TOP' : value
}
const tries = ref({})
// Same as openPaymentWindow above: reads a real field (comp.forcepayment)
// but nothing in the template checks it yet. Part of the same unfinished
// competition-payment feature.
// eslint-disable-next-line no-unused-vars
const isPaymentForced = computed(() => props.comp.forcepayment == 1)
const isPaidAndPriceIsSet = computed(() => {
  if (climber.value == null) {
    return false
  }
  // Now go through each row and check prices and payment statuses
  const rows = props.comp.categories.reduce((acc, cat) => {
    const finding = cat.participants.find(x => x.contenderid == climber.value.id)
    if (finding != null) {
      acc.push(finding)
    }
    return acc
  }, [])
  for (const rowKey in rows) {
    const row = rows[rowKey]
    const serie = props.comp.categories.find(x => x.id == row.serieid)
    const price = parseFloat(serie.pivot.price)
    // This used to do `totalPrice.value += price` — a computed writing to a
    // ref, so the total grew on every re-evaluation rather than being
    // recalculated. totalPrice was never read anywhere, so the accumulation
    // was pure side effect and is gone.
    // IF there is a price, but no payment info, return false immediately
    if (!isNaN(price) && price > 0 && (row.paid == null || dayjs(row.paid).year() == 0)) {
      return false
    }
  }
  return true
})

// Read again every second, with the clock below: the rows appear when the
// tick window opens and give way to the notice when it closes. Computed
// once, a page opened early kept saying "not started" until it was
// reloaded, and a page left open past the end kept offering Save for ticks
// the results no longer count.
const nowUTC = ref(dayjs().utc())
const compOngoing = computed(() => {
  // Missing timespan_start/timespan_end means no limit on that side.
  return isCompRunning(props.comp, nowUTC.value)
})

// First, set the tries from the comp object.
const toIntOrNull = (v) => (v == null ? null : parseInt(v))
tries.value = Object.keys(props.comp.userticks).reduce((acc, key) => {
  const aTick = props.comp.userticks[key]
  acc[aTick.problemid] = {
    tries: parseInt(aTick.tries),
    tries_bonus: parseInt(aTick.tries_bonus),
    attempts_low_zone: toIntOrNull(aTick.attempts_low_zone),
    attempts_high_zone: toIntOrNull(aTick.attempts_high_zone),
    ticked: true,
    sport_points: aTick.sport_points,
  }
  return acc
}, {})
// sport: a saved partial height has no tick. A tick, when there is one, wins.
const savedScores = props.comp?.my_checkpoint_scores ?? {}
Object.keys(savedScores).forEach((pid) => {
  if (tries.value[pid] == null) {
    tries.value[pid] = { tries: 1, sport_points: savedScores[pid] }
  }
})

const onDeleted = (id) => {
  const payload = {
    problemid: id,
    point_entry_key: climber.value.point_entry_key,
    compid: props.comp.id,
  }
  deleteTickByProblemMutate(payload)
    .then((ret) => {
      // Forget the row's entered tries so it starts again from 1.
      const rest = { ...tries.value }
      delete rest[id]
      tries.value = rest
      toaster(t(ret.message))
    })
    // Said out loud: a delete that failed used to leave the row exactly as
    // it was, with nothing to tell it from one that had not been tried.
    .catch(() => toaster(t('comps.delete_failed')))
}
// Trash button on a ticked row: same delete as the swipe action, behind a confirm.
const confirmDelete = (id) => {
  f7.dialog.confirm(t('problem.tick_delete_are_you_sure'), t('comps.delete_ascent'), () => onDeleted(id))
}
// Only the tries to top are set here: the ladder types keep their zone and
// bonus counts on the ladder, and the steppers left have no bonus or zones.
const setTries = (id, triesAmount) => {
  tries.value[id] = { ...(tries.value[id] ?? { sport_points: 0 }), tries: triesAmount }
}
const lastUpdate = ref(dayjs())
// Driven by the query itself rather than a fetch-and-set here: it refetches
// on its own 45s interval (see compResultsQuery above), and this just
// stamps whenever a fetch actually lands a new payload.
const lastResultUpdate = ref(dayjs())
watch(compResultsQuery.data, () => { lastResultUpdate.value = dayjs() })

let timerID = null

if (props.comp.tyyppi == 'variable_points') {
  const fetchPointsPerRoute = () => {
    // Update points per route
    const payload = { compid: props.comp.id  }
    getPointsPerRouteMutate(payload)
      .then(() => {
        lastUpdate.value = dayjs()
      })
      .catch(err => {
        errors.value = handleValidationErrors(err)
      })

  }
  timerID = setInterval(fetchPointsPerRoute , 27 * 1000) // every 30 seconds
  fetchPointsPerRoute()
}

// What is left of the tick window as { days, clock, urgent }, or null when
// the competition has no end to count down to.
const timeLeft = ref(countdown(msUntilEnd(props.comp)))
const clockID = setInterval(() => {
  nowUTC.value = dayjs().utc()
  timeLeft.value = countdown(msUntilEnd(props.comp))
}, 1000)

onUnmounted(() => {
  // Stop udpates when page unloads
  if (timerID != null) {
    clearInterval(timerID)
  }
  clearInterval(clockID)
})

// Ladder comps: zones + tries on a ladder per route; the Top is the
// ordinary tick with tries = the route's running attempt count. The ladder
// tracks its own per-row saving state (ladders.isSaving), so saveTickFor is
// called directly here, bypassing the generic Save button's busy lock below.
// The bonus + top types score the tick's own tries_bonus, so their Top
// carries the bonus rung's count; the others keep the tick's as it was.
const ladders = useCheckpointLadders({
  comp: () => props.comp,
  compId: () => props.comp.id,
  t,
  saveTop: (pid, triesToTop, triesBonus) => {
    setTries(pid, triesToTop)
    return saveTickFor(pid, isTriesAndBonusType.value ? triesBonus : undefined)
  },
  deleteTop: (pid) => deleteTickByProblemMutate({ problemid: pid, point_entry_key: climber.value?.point_entry_key, compid: props.comp.id }),
  zonesFor: (prob) => ZONE_COUNTS[props.comp.tyyppi] ?? prob?.pivot?.checkpoints?.length ?? 0,
  saveCheckpoint: (payload) => saveCheckpointMutate(payload),
  deleteCheckpoint: (payload) => deleteCheckpointMutate(payload),
  bonusAffectsTop: isTriesAndBonusType.value,
  legacyZoneTries: props.comp.tyyppi == 'ifsc_2024_bouldering'
    ? (tick) => ({ 1: tick.attempts_low_zone, 2: tick.attempts_high_zone })
    : undefined,
})

// sport: only the top (1000) is a tick. A lower height is partial credit,
// saved as the route's score so it never counts as an ascent.
const onSave = (id) => {
  const points = parseSportPoints(tries.value[id]?.sport_points)
  if (props.comp.tyyppi != 'sport' || points === 1000) return doTick(id)
  return saveSportScore(id, points)
}
const saveSportScore = (id, score) => {
  if (busy.value[id]) return
  if (!Number.isFinite(score)) {
    toaster(t('ladder.not_saved'))
    return
  }
  busy.value = { ...busy.value, [id]: true }
  // A route already topped is being lowered: the top tick would outrank the
  // new score, so it goes first.
  const untop = isTicked(id)
    ? deleteTickByProblemMutate({ problemid: id, point_entry_key: climber.value?.point_entry_key, compid: props.comp.id })
    : Promise.resolve()
  return untop
    .then(() => saveCheckpointMutate({ compid: props.comp.id, problemid: id, score }))
    .then(() => toaster(t('comps.score_saved')))
    .catch(() => toaster(t('ladder.not_saved')))
    .finally(() => { busy.value = { ...busy.value, [id]: false } })
}

const doTick = (id) => {
  if (busy.value[id]) return
  busy.value = { ...busy.value, [id]: true }
  saveTickFor(id)
    // Same message a failed sport score already gets. Without it a tick that
    // did not save looked the same as one never tried.
    .catch(() => toaster(t('ladder.not_saved')))
    .finally(() => { busy.value = { ...busy.value, [id]: false } })
}
// triesBonus, when given, replaces the tries_bonus derived from the row.
const saveTickFor = (id, triesBonus) => {
  let aSportPoints = 0
  if (tries.value[id] != null) {
    aSportPoints = tries.value[id].sport_points
  }
  // At least one try; bonus and zones keep their "not recorded" values.
  const { tries: aTries, tries_bonus: aTriesBonus, attempts_low_zone: aAttemptsLowZone, attempts_high_zone: aAttemptsHighZone } = compTickTries(tries.value[id])

  const payload = {
    ticktype: 'tick',
    tries: aTries,
    tries_bonus: triesBonus === undefined ? aTriesBonus : triesBonus,
    // ifsc_2024_bouldering keeps its zones on the ladder; the tick's old zone
    // fields are left as they are, or the server would clamp the tries up to them.
    ...(props.comp.tyyppi == 'ifsc_2024_bouldering' ? {} : { attempts_low_zone: aAttemptsLowZone, attempts_high_zone: aAttemptsHighZone }),
    created: new Date(),
    problemid: id,
    sport_points: aSportPoints,
    grade_opinion: null,
    compid: props.comp.id,
  }
  return saveTickMutate(payload)
    .then((ret) => {
      tries.value[id] = { ...tries.value[id], ticked: true }
      toaster(t('comps.tick_saved'))
      if (ret.new_badges && ret.new_badges.length > 0) {
        ret.new_badges.forEach(badge => {
          setTimeout(() => toaster('You earned: ' + badge.name, 'Badge Unlocked!'), 500)
        })
      }
      return ret
    })
}
const getStyles = (prob) => {
  const htmlcolour = prob.colour.code
  const textcolor = prob.colour.textcolor
  return {
    'background-color': htmlcolour,
    color: textcolor,
  }
}
const tickCount = computed(() => {
  const comp = props.comp
  if (comp == null) {
    return 0
  }
  return Object.keys(comp.userticks).length
})
const sortedProblems = computed(() => {

  // [...] first: this sorts a COPY. Sorting props.comp.problems directly
  // reordered store.state.competition.problems in place, from inside a
  // computed getter — a child mutating shared state as a side effect of
  // being read.
  const probs = [...(props.comp.problems ?? [])].sort((a, b) => {
    const anum = parseInt(a.pivot.num)
    const bnum = parseInt(b.pivot.num)
    if (anum - bnum == 0) {
      return a.tag.localeCompare(b.tag)
    } else {
      return anum - bnum
    }
  })
  if (props.comp.tyyppi == 'sport') {
    // Add additional filtering, if there are route bindings...
    return probs.filter(x => {
      if (x.pivot == null) {
        return true
      }
      return x.pivot.bind_to_category == compClimber.value?.pivot.serieid
    })

  }
  return probs
})
</script>

<style>
/* Not scoped: most of this reaches into Framework7's own list markup, which
   a scoped block cannot see. Everything is kept under .ce instead. */
.ce {
  max-width: 44rem;
  margin: 0 auto;
  padding-bottom: 1rem;
}
.ce button:focus-visible,
.ce input:focus-visible {
  outline: 2px solid var(--p-accent);
  outline-offset: 2px;
}

/* ---- Header ---- */
.ce-head__name {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--p-text);
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.ce-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
}
/* p-badge brings its own utility margins and size; .ce outranks them. */
.ce .ce-chip {
  margin: 0;
  padding: 0.1875rem 0.625rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius-full);
  background: var(--p-bg-card);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--p-text-secondary);
}
/* Neutral on purpose: accent is kept for what can be pressed. */
.ce .ce-chip--type {
  background: var(--p-bg-card-hover);
  color: var(--p-text);
}
.ce-facts {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 0.25rem 0.875rem;
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.4;
}
.ce-facts dt,
.ce-count dt {
  color: var(--p-text-muted);
}
.ce-facts dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  color: var(--p-text-secondary);
}
.ce-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1.125rem;
  margin: 0.625rem 0 0;
  padding-top: 0.625rem;
  border-top: 1px solid var(--p-border);
  font-size: 0.8125rem;
  line-height: 1.4;
}
.ce-count {
  display: flex;
  gap: 0.375rem;
}
.ce-count dd {
  margin: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--p-text);
}
/* Only there for when an organiser asks which competition this is. */
.ce-count--id {
  margin-left: auto;
}
.ce-count--id dd {
  font-weight: 400;
  color: var(--p-text-muted);
}

.ce-notice {
  align-items: center;
  margin-top: 1rem;
}
.ce-notice .p-banner__icon {
  margin-top: 0;
  font-size: 1.125rem;
}

/* ---- Tabs: point entry / results / route details ---- */
.ce-tabbar {
  margin-top: 0.875rem;
  border-radius: var(--p-radius);
  background: var(--p-bg-card);
}
/* Framework7's active-tab underline (.tab-link-highlight) has no vertical
   position of its own -- it only gets one from the .toolbar-top/-bottom
   classes, and those classes also carry `top: calc(navbar-height)` for
   toolbars that are page-level absolute subnavbars (`.navbar ~ * .toolbar-top`
   in framework7-bundle.css). This toolbar is inline content, not one of
   those, so adding the prop shifted the whole bar down into the row below
   it instead of just fixing the underline. Set only the one declaration we
   actually need (.toolbar-top's own `bottom: 0` for the highlight). */
.ce-tabbar .tab-link-highlight {
  bottom: 0;
}
.ce-tab-results,
.ce-tab-routes {
  padding-top: 0.5rem;
}
.ce-route-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.ce-route-row {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--p-border);
}
.ce-route-row__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.ce-route-row__facts {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--p-text-secondary);
}
.ce-route-row__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  font-size: 0.75rem;
  color: var(--p-text-muted);
}
.ce-route-row__stat {
  white-space: nowrap;
}
.ce-route-row__fact {
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius-full);
  background: var(--p-bg-card);
}
.ce-route-row__grade {
  font-weight: 700;
  color: var(--p-text);
}

/* ---- Clock and tally ---- */
.ce-bar {
  position: -webkit-sticky;
  position: sticky;
  /* Zero, not the navbar's height: the scrolling box already keeps its
     content clear of the navbar with padding, and sticky counts from there.
     Framework7's own sticky list headings do the same. */
  top: 0;
  z-index: 20;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  /* Out to the edges of the page, through the block's own padding. */
  margin: 0.875rem calc(-1 * (var(--f7-block-padding-horizontal) + var(--f7-safe-area-right))) 0
    calc(-1 * (var(--f7-block-padding-horizontal) + var(--f7-safe-area-left)));
  padding: 0.625rem calc(var(--f7-block-padding-horizontal) + var(--f7-safe-area-right)) 0.625rem
    calc(var(--f7-block-padding-horizontal) + var(--f7-safe-area-left));
  border-top: 1px solid var(--p-border);
  border-bottom: 1px solid var(--p-border);
  /* The navbar's own surface, so the strip reads as part of it once stuck. */
  background: rgba(15, 21, 38, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.ce-bar__time,
.ce-bar__ticks {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  min-width: 0;
  color: var(--p-text);
}
.ce-bar__time .material-icons {
  align-self: center;
  font-size: 1.125rem;
  color: var(--p-text-muted);
}
.ce-bar__clock,
.ce-bar__days,
.ce-bar__count {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.ce-bar__nolimit {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--p-text-secondary);
}
.ce-bar__total {
  margin-left: -0.3125rem;
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--p-text-muted);
}
.ce-bar__unit {
  font-size: 0.8125rem;
  color: var(--p-text-muted);
}
.ce-bar__time--urgent,
.ce-bar__time--urgent .material-icons {
  color: #fcd34d;
}

/* Wider than the column, the strip can no longer run edge to edge, so it
   is held to the column as a bar of its own. */
@media (min-width: 46rem) {
  .ce-bar {
    margin-right: 0;
    margin-left: 0;
    padding-right: 1rem;
    padding-left: 1rem;
    border: 1px solid var(--p-border-light);
    border-radius: var(--p-radius);
  }
}

.ce-hint {
  margin: 0.625rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--p-text-muted);
}

/* ---- Scoring rows ----
   One row is two lines: which problem it is, then the control that scores
   it. Framework7 gives a list item three boxes (media, title, after); they
   are dissolved here so their contents can be laid out on one grid, without
   moving a single binding in the template. */
.ce .ce-rows {
  margin: 0.5rem 0 0;
}
.ce .ce-rows ul::before,
.ce .ce-rows ul::after {
  content: none;
}
.ce-row {
  border-bottom: 1px solid var(--p-border);
}
.ce-rows .ce-row .item-content {
  display: grid;
  /* The last column is the trash can's. It is held open on every row so
     Save does not move sideways when a row gets ticked. */
  grid-template-columns: minmax(0, 1fr) auto 2.75rem;
  align-items: center;
  gap: 0.5rem;
  min-height: 0;
  padding: 0.75rem 0;
}
.ce-rows .ce-row .item-inner,
.ce-rows .ce-row .item-title,
.ce-rows .ce-row .item-after,
.ce-rows .ce-row .ce-entry--points {
  display: contents;
}
.ce-rows .ce-row .item-media {
  grid-area: 1 / 1;
  min-width: 0;
  padding: 0;
}
.ce-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}
.ce-id__num {
  min-width: 1.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--p-text);
}
.ce-row--ticked .ce-id__num {
  color: var(--p-success);
}
.ce-id__swatch {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  /* The ring keeps black and dark-blue holds visible on the dark page. */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.3125rem;
}
.ce-id__tag {
  font-size: 0.8125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--p-text-muted);
}
.ce-points {
  grid-area: 1 / 2;
  justify-self: end;
  max-width: 9rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius-sm);
  background: var(--p-bg-card);
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: normal;
  color: var(--p-text-secondary);
}
.ce-check {
  grid-area: 1 / 3;
  display: flex;
  justify-content: center;
}
.ce-check .material-icons {
  font-size: 1.375rem;
  color: var(--p-success);
}
.ce-entry,
.ce-entry--points > .stepper {
  grid-area: 2 / 1;
  justify-self: start;
  min-width: 0;
}
/* Flex, so an inline stepper does not sit on a text baseline with a few
   pixels of descender under it and end up above its Save button. */
.ce-entry {
  display: flex;
  align-items: center;
}
.ce-row.comp-row--ladder .ce-entry {
  grid-column: 1 / -1;
  justify-self: stretch;
}
.ce-entry--unsupported {
  font-size: 0.875rem;
  white-space: normal;
  color: var(--p-text-muted);
}
.ce-row .ce-save {
  grid-area: 2 / 2;
  width: auto;
  min-width: 5rem;
  min-height: 2.75rem;
  padding: 0 0.875rem;
}
.ce-row .ce-save:disabled {
  opacity: 0.5;
  cursor: default;
}
.ce-trash {
  grid-area: 2 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--p-radius);
  color: var(--p-danger-tint);
  -webkit-tap-highlight-color: transparent;
  transition: background var(--p-duration) var(--p-ease);
}
.ce-trash:active {
  background: rgba(239, 68, 68, 0.2);
}

/* The tries stepper: thumb-sized, and tinted rather than solid — a column of
   solid accent buttons would outshout Save on every row. */
.ce-row .stepper {
  --f7-stepper-height: 2.75rem;
  --f7-stepper-border-radius: var(--p-radius);
  --f7-stepper-fill-button-bg-color: rgba(var(--p-accent-rgb), 0.14);
  --f7-stepper-fill-button-text-color: var(--p-accent);
  --f7-stepper-fill-button-pressed-bg-color: rgba(var(--p-accent-rgb), 0.3);
  --f7-stepper-value-text-color: var(--p-text);
  --f7-stepper-value-font-size: 1.125rem;
  --f7-stepper-value-font-weight: 700;
}
.ce-row .stepper-button-minus,
.ce-row .stepper-button-plus {
  width: 2.75rem;
  border-color: rgba(var(--p-accent-rgb), 0.25);
}
.ce-row .stepper-input-wrap {
  border-color: rgba(var(--p-accent-rgb), 0.25);
}
.ce-row .stepper .stepper-input-wrap input {
  width: 2.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  font-variant-numeric: tabular-nums;
}

/* Framework7 strips a text input inside a list down to bare text; this one
   has to look like the field it is. */
.ce-rows .ce-row input.ce-input {
  width: 9.5rem;
  max-width: 100%;
  height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid var(--p-border-light);
  border-radius: var(--p-radius);
  background: rgba(255, 255, 255, 0.03);
  font-size: 1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--p-text);
  caret-color: var(--p-accent);
}
.ce-rows .ce-row input.ce-input::placeholder {
  font-weight: 400;
  color: var(--p-text-muted);
}
.ce-rows .ce-row input.ce-input:focus {
  border-color: rgba(var(--p-accent-rgb), 0.4);
  background: rgba(var(--p-accent-rgb), 0.04);
}

/* A finger leaves :hover behind on the button it last touched, which made a
   tapped Save look lit until the next tap elsewhere. */
@media (hover: none) {
  .ce .p-btn:hover {
    transform: none;
    box-shadow: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ce-trash {
    transition: none;
  }
}
</style>
