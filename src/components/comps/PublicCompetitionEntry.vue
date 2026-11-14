<template>
  <div v-if="comp != null">


    <f7-popup v-model:opened="showResultList">
      <f7-page>
        <f7-navbar title="Results">
          <f7-nav-right>
            <f7-link popup-close>Close</f7-link>
          </f7-nav-right>
        </f7-navbar>
        <f7-block v-if="compResults != null">
          <show-results :type="comp.tyyppi" :last-update="lastResultUpdate" :results="compResults.results" />
        </f7-block>
      </f7-page>

    </f7-popup>

    <f7-popup v-model:opened="showPointsPerRoute">
      <f7-page>
        <f7-navbar title="Points per problem">
          <f7-nav-right>
            <f7-link popup-close>Close</f7-link>
          </f7-nav-right>
        </f7-navbar>
        <f7-block>
          <points-per-route :last-update="lastUpdate" :points-per-route="comp.points_per_route" :topped-ids="toppedIds" :tries-by-id="tries" />
        </f7-block>
      </f7-page>
    </f7-popup>
    <div class="flex flex-row justify-between w-full">
      <div>{{ now }}</div>
      <div>ID: {{ comp.id  }}</div>
    </div>
    <div class="flex flex-row justify-between">
      <p-badge class="text-sm py-1 bg-blue-500">{{ comp.location ?? "Location not set"}}</p-badge>
      <p-badge class="text-sm py-1 bg-green-500">{{ t('comps.' + comp.tyyppi) }}</p-badge>
    </div>
    <div class="flex flex-row justify-between">
      <h1 class="p-0 m-0 text-2xl font-bold">{{ comp.name }}</h1>
    </div>
    <div class="flex flex-row justify-between">
      Competition venue opens at: {{ toLocalTime(comp.compdate) }}
      <small class="m-0">ID: {{ comp.id }}</small>
    </div>
    <h3 class=""> {{ t('comps.timespan') }} {{ windowLabel(comp.timespan_start, comp.timespan_end, toLocalTime, t('comps.no_time_limit')) }} </h3>
    <div class="my-1 flex flex-row justify-between">
      <h2 class="text-xl">
        <p-badge class="text-xl py-1 bg-blue-500">  {{ sortedProblems.length }}</p-badge>
        problem(s)
      </h2>
      <div class="text-xl">
      {{ t('comps.participants') }}
      <p-badge class="text-xl py-1 bg-blue-500">  {{ comp.paidregistrations?.length }}</p-badge>
      </div>
    </div>
    <div v-if="isTopPointsType" class="my-1 flex flex-row flex-wrap gap-1">
      <p-badge v-if="comp.tyyppi == 'fixed_points_best_n' && comp.nbest" class="text-sm py-1 bg-indigo-500">{{ t('comps.best_n_count', { n: comp.nbest }) }}</p-badge>
    </div>
    <div v-if="sortedProblems.length == 0" class="my-3 text-2xl">
      No problems have been added - yet.
    </div>
    <div v-if="isJudge">
      <f7-block-title>{{ t('comps.you_are_a_judge') }}</f7-block-title>
      <f7-link :href="getJudgingLink" class="btn-primary font-bold ">Open judging sheet</f7-link>

    </div>

    <div>

      <div v-if="compOngoing ">

        <div v-if="comp.tyyppi == 'variable_points'">
          <p-button class="bg-yellow-400 dark:bg-yellow-600" @click="showPointsPerRoute=!showPointsPerRoute">Toggle show points per route</p-button>
        </div>

        <p-button class="my-1 bg-teal-400 dark:bg-teal-600" @click="showResultList=!showResultList">Toggle show result list</p-button>
        <div class="text-center">
          <span class="dark:text-white text-black text-lg">{{ timeLeft }}</span>
        </div>
        <p v-if="!isLadderType" class="text-center">{{ t('comps.delete_ascent_hint') }}</p>
        <p v-else class="text-center">Swipe left to delete an ascent</p>
        <p v-if="comp.tyyppi == 'sport'" class="text-center text-sm text-gray-400">{{ t('comps.sport_points_hint') }}</p>
        <f7-list class="m-0">
          <f7-list-item>
            <template #title>
              <span class="text-3xl font-bold">{{ tickCount }}</span> /<span class="text-lg">{{ sortedProblems.length }}</span>
              {{ t('comps.ticked') }}
            </template>
          </f7-list-item>

          <f7-list-item swipeout v-for="prob in sortedProblems" :key="prob.id" :class="ladderRowClass">
            <f7-swipeout-actions right>
              <f7-swipeout-button color="red" close @click="() => onDeleted(prob.id)" confirm-text="Are you sure you want to delete this tick?">Delete</f7-swipeout-button>
            </f7-swipeout-actions>
            <template #media>
              <div class="w-16 flex flex-row justify-between">
                <div class="flex flex-col">
                  <div class="mr-1 font-bold text-xl">{{ prob.pivot.num }}</div>
                  <div class="mr-2 pt-0 text-sm font-bold">{{ right(prob?.tag,4) }}</div>
                </div>
                <div class="flex flex-col w-8">
                  <div class="h-6 mt-3 w-6 border border-white rounded-md" :style="getStyles(prob)"></div>
                </div>
              </div>
            </template>
            <template #title>
              <div v-if="comp.tyyppi == 'variable_points'">
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi == 'predefined_plus_flashcomp'" class="flex flex-row ">
                
                <div class="flex flex-row items-center mr-2">
                <div class="text-sm font-bold bg-blue-500 text-white rounded-md p-1 dark:bg-blue-600 mr-1 w-8 h-8 flex items-center justify-center">
                  {{ getPointsPerProblem(prob.pivot.num) }} 
                </div>
                </div>
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi=='checkpoint_points'" class="w-full">
                <checkpoint-ladder
                  :problem="prob"
                  :state="ladderFor(prob)"
                  readonly
                />
              </div>
              <div v-else-if="comp.tyyppi=='fixed_points_best_n'" class="flex flex-row">
                <div class="flex flex-row items-center mr-2">
                  <div class="text-sm font-bold bg-blue-500 text-white rounded-md p-1 dark:bg-blue-600 mr-1 min-w-[2rem] h-8 flex items-center justify-center">
                    {{ prob.pivot.max_points }}
                  </div>
                </div>
                <f7-stepper fill :min="1" :value="tries[prob.id]?.tries || 1" @stepper:change="(num) => setTries(prob.id, num)"></f7-stepper>
              </div>
              <div v-else-if="comp.tyyppi=='sport'">
                <input :value="sportPointsDisplay(prob.id)" @change="(e) => onChangeSportPoints(prob.id, e)" class="border border-white h-12 w-24" :placeholder="t('Enter points')" type="text" />
              </div>
              <div v-else-if="isZoneLadderType" class="w-full">
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
              <div v-else>
                Comp type not supported (yet)
              </div>
            </template>
            <template #after>
              <p-button
                v-if="!isZoneLadderType"
                :disabled="busy[prob.id]"
                @click="() => onSave(prob.id)"
                class="w-20 py-2 dark:bg-green-500 bg-green-600 disabled:opacity-50"
              >{{ busy[prob.id] ? t('global.saving') : t('global.save') }}</p-button>
              <span v-if="isTicked(prob.id)" class="w-5 text-red-400 font-bold text-2xl">✓</span>
              <span v-else class="w-5 text-white font-bold text-2xl">&nbsp;</span>
              <button
                v-if="!isLadderType && isTicked(prob.id)"
                type="button"
                data-test="delete-ascent"
                class="w-11 h-11 shrink-0 flex items-center justify-center rounded-md text-red-600 dark:text-red-400 active:bg-red-500/20"
                :aria-label="t('comps.delete_ascent')"
                :title="t('comps.delete_ascent')"
                @click="() => confirmDelete(prob.id)"
              ><i class="icon f7-icons" style="font-size: 22px;" aria-hidden="true">trash</i></button>
            </template>
          </f7-list-item>
        </f7-list>
      </div>
      <div v-else>
        <div class="text-center font-bold text-xl text-red-500 border-t-2 border-red-700 mt-2">
          {{ t('comps.the_comp_has_not_started_yet') }}
        </div>
      </div>
    </div><!-- if paid -->
    {{ errors }}
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { f7 } from 'framework7-vue'

import { onUnmounted,  computed, ref } from 'vue'
import PButton from '@components/PButton.vue'
import { right } from '@js/helpers'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import PBadge from '@components/PBadge.vue'
import PointsPerRoute from './PointsPerRoute.vue'
import CheckpointLadder from './CheckpointLadder.vue'
import { fromServer as ladderFromServer } from '@helpers/ladder.js'
import { useCheckpointLadders } from '@js/useCheckpointLadders.js'
import { TOP_POINTS_TYPES, TRIES_AND_BONUS_TYPES, myCheckpointFor as myCheckpointForHelper } from '@helpers/checkpoints.js'
import ShowResults from './ShowResults.vue'
import { webendpoint } from '@js/api.js'

import {  toaster } from '@helpers/notifications.js'
import { compTickTries, parseSportPoints } from '@helpers/compTries.js'
import { toLocalTime } from '@helpers/component.helpers'
import { isCompRunning, msUntilEnd, windowLabel } from '@helpers/compWindow'
import { handleValidationErrors } from '@helpers'
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

const now = computed(() =>   dayjs().format("DD.MM.YYYY HH:mm") )

const props = defineProps({
  comp: Object,
})

const store = useStore()
const ticks = computed(() => store.state.alltime.ticks)
const isTicked = (pid) => {
  // check this against comp ticks
  const comp = store.state.competition
  if (comp == null) {
    return false
  }
  const tick = comp.userticks[pid]
  return tick != null
}

// Route ids the climber has already topped in this comp (the preview only applies to the rest).
const toppedIds = computed(() => Object.keys(store.state.competition?.userticks || {}).map(Number))
const isTopPointsType = computed(() => TOP_POINTS_TYPES.includes(props.comp.tyyppi))
const isTriesAndBonusType = computed(() => TRIES_AND_BONUS_TYPES.includes(props.comp.tyyppi))
const myCheckpointFor = (pid) => myCheckpointForHelper(store.state.competition?.my_checkpoints, pid)
// Read-only here: the checkpoint endpoints need a signed-in climber.
const ladderFor = (prob) => {
  const tries = store.state.competition?.my_checkpoint_tries
  return ladderFromServer({
    zones: prob?.pivot?.checkpoints?.length ?? 0,
    checkpoint: myCheckpointFor(prob.id),
    tries: tries == null || Array.isArray(tries) ? null : tries[prob.id],
    topTick: store.state.competition?.userticks?.[prob.id] ?? null,
  })
}
// Zones/bonus + top on a ladder, saved like checkpoint_points' on the
// signed-in page: a zone or bonus goes to the comp's checkpoint results, only
// the Top is a real tick. Rungs below the top, per type.
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
// A ladder takes the row's spare width. checkpoint_points' read-only ladder
// still has the Save button beside it, so that row stacks the button under
// the ladder (see the styles at the end of this file).
const ladderRowClass = computed(() => {
  const stacked = props.comp.tyyppi == 'checkpoint_points'
  return { 'comp-row--ladder': isLadderType.value, 'comp-row--ladder-stacked': stacked }
})
const errors = ref("")
const loaded = ref(false)
const showPointsPerRoute = ref(false)
const showResultList = ref(false)
dayjs.extend(duration)
dayjs.extend(isBetween)
const { t } = useI18n()
const compResults = computed(() => store.state.compResults)
const climber = computed(() => store.state.climber)

const isJudge = computed(() => {
  const comp = props.comp
  if (comp.judges == null) {
    return false
  }
  if (climber.value == null) {
    return false
  }
  const judgeids = comp.judges.map(jobj => jobj.id)
  return judgeids.includes(climber.value.id)
})
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
const busy = ref({})
const getJudgingLink = computed(() => {
  if (props.comp != null) {
    const url = `/competitions/${props.comp.id}/judging`
    return url
  }
  // No competition yet: say so, rather than returning undefined.
  return null
})
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

const compOngoing = computed(() => {
  const nowUTC = dayjs().utc()

  // Missing timespan_start/timespan_end means no limit on that side.
  return isCompRunning(props.comp, nowUTC)
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

const onDeleted = (id) => {
  const payload = {
    problemid: id,
    point_entry_key: climber.value.point_entry_key,
  }
  store
    .dispatch('publicDeleteTickByProblem', payload)
    .then((ret) => {
      // Forget the row's entered tries so it starts again from 1.
      const rest = { ...tries.value }
      delete rest[id]
      tries.value = rest
      toaster(t(ret.message))
    })
    .catch((err) => { })
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
const lastResultUpdate = ref(dayjs())

let timerID = null

if (props.comp.tyyppi == 'variable_points') {
  const fetchPointsPerRoute = () => {
    // Update points per route
    const payload = { compid: props.comp.id, point_entry_key: climber.value.point_entry_key }
    store.dispatch('publicGetPointsPerRoute', payload)
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

const fetchResults = () => {
  // Update points per route
  const payload = { compid: props.comp.id  , point_entry_key: climber.value.point_entry_key }
  store.dispatch('publicGetCompResults', payload)
    .then(() => {
      lastResultUpdate.value = dayjs()
      loaded.value = true
    })
      .catch(err => {
        //errors.value = handleValidationErrors(err)
      })
}
const resultTimerID = setInterval(fetchResults, 45 * 1000)
fetchResults()

onUnmounted(() => {
  // Stop udpates when page unloads
  if (timerID != null) {
    clearInterval(timerID)
  }
  clearInterval(resultTimerID)
})

setInterval(() => {
  // Update time left
  const ms = msUntilEnd(props.comp)
  if (ms === null) {
    timeLeft.value = t('comps.no_time_limit')
    return
  }
  const dur = dayjs.duration(ms)
  timeLeft.value = dur.format('D[day(s)] HH[h] mm[m] ss[s]') + ' left'
}, 1000)
const timeLeft = ref(null)

// Ladder comps: zones + tries on a ladder per route; the Top is the
// ordinary tick with tries = the route's running attempt count. The ladder
// tracks its own per-row saving state, so saveTickFor is called directly,
// bypassing the Save button's busy lock. The bonus + top types score the
// tick's own tries_bonus, so their Top carries the bonus rung's count.
const withKey = (payload) => ({ ...payload, point_entry_key: climber.value?.point_entry_key })
const ladders = useCheckpointLadders({
  store,
  compId: () => props.comp.id,
  t,
  saveTop: (pid, triesToTop, triesBonus) => {
    setTries(pid, triesToTop)
    return saveTickFor(pid, isTriesAndBonusType.value ? triesBonus : undefined)
  },
  deleteTop: (pid) => store.dispatch('publicDeleteTickByProblem', withKey({ problemid: pid })),
  zonesFor: () => ZONE_COUNTS[props.comp.tyyppi] ?? 0,
  saveCheckpoint: (payload) => store.dispatch('publicSaveCheckpoint', withKey(payload)),
  deleteCheckpoint: (payload) => store.dispatch('publicDeleteCheckpoint', withKey(payload)),
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
    ? store.dispatch('publicDeleteTickByProblem', withKey({ problemid: id }))
    : Promise.resolve()
  return untop
    .then(() => store.dispatch('publicSaveCheckpoint', withKey({ compid: props.comp.id, problemid: id, score })))
    .then(() => toaster(t('comps.score_saved')))
    .catch(() => toaster(t('ladder.not_saved')))
    .finally(() => { busy.value = { ...busy.value, [id]: false } })
}

const doTick = (id) => {
  if (busy.value[id]) return
  busy.value = { ...busy.value, [id]: true }
  saveTickFor(id)
    .catch(() => { })
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
    point_entry_key: climber.value.point_entry_key,
  }
  return store
    .dispatch('publicSaveTick', payload)
    .then((ret) => {
      tries.value[id] = { ...tries.value[id], ticked: true }
      toaster(t('comps.tick_saved'))
      return ret
    })
}
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
const pointRules = computed(() => {
  const comp = store.state.competition
  if (comp.pointsharingobj == null) {
    return null
  }
  return comp.pointsharingobj
})

const getStyles = (prob) => {
  const htmlcolour = prob.colour.code
  const textcolor = prob.colour.textcolor
  return {
    'background-color': htmlcolour,
    color: textcolor,
  }
}
const tickCount = computed(() => {
  const comp = store.state.competition
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
    const compClimber = props.comp.paidregistrations.find(x => x.id == climber.value.id)
    return probs.filter(x => {
      if (x.pivot == null) {
        return true
      }
      return x.pivot.bind_to_category == compClimber.pivot.serieid
    })

  }
  return probs
})
</script>

<style>
/* A row whose entry control is a ladder. Framework7 sizes a list title to
   its content, so a ladder with short labels came out narrow; here it takes
   whatever the row has left. */
.comp-row--ladder .item-title {
  flex: 1 1 auto;
  min-width: 0;
}
/* ...and with the Save button beside it that was only ~120px on a phone,
   too little for the labels: the ladder takes the row's full width and the
   buttons go on a line of their own under it. */
.comp-row--ladder-stacked .item-inner {
  flex-wrap: wrap;
  row-gap: 4px;
}
.comp-row--ladder-stacked .item-title {
  flex-basis: 100%;
}
.comp-row--ladder-stacked .item-after {
  margin-left: auto;
}
</style>
