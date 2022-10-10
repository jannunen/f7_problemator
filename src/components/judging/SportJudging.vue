<template>
  <f7-block>
    <h1 class="my-1 font-bold text-xl">Judging sheet - sport climbing</h1>
    <div class="my-2">
      Start writing any part of the contender name. Or use number in shirt. You can even
      use first letters of first AND last name.
    </div>

    <f7-list no-hairlines-md class="m-0 p-0">
      <f7-list-input
        :label="t('judging.contender_name')"
        type="text"
        @keyup="fetchContender"
        :placeholder="t('judging.name_placeholder')"
        clear-button
        v-model:value="search"
        @input:clear="clearContender"
      >
      </f7-list-input>
    </f7-list>

    <!--
    <div v-if="selected != null" class="font-bold text-center">
      {{ selected.id }} {{ selected.nimi }}
    </div>
    -->

    <div
      v-if="hits.length > 0"
      class="absoluet m-2 border-2 border-black bg-white w-11/12 h-1/2"
    >
      Choose a contender
      <ul class="">
        <li
          v-for="hit in hits"
          :key="hit.id"
          class="my-1 border border-gray-700 mx-4 text-center py-1 px-2 bg-blue-400"
        >
          <div @click="() => selectContender(hit)">
            {{ hit.nimi }} <small class="self-end">{{ hit.id }}</small>
          </div>
        </li>
        <li class="redButton my-2" @click="clearSearch" > Close </li>
      </ul>
    </div>

    <div class="flex flex-col my-2 " >
      
        <div v-if="comp.problems.length == 0" class="font-bold py-4 px-2 bg-red-400 border border-2 border-red-700 m-1">
          You don't have any routes yet! Go to <strong>routes</strong> and edit route to
          set the route type
        </div>
        <f7-list v-else >

          <f7-list-item
          title="Route"
          smart-select
          :smart-select-params="{closeOnSelect : true, openIn: 'popup', searchbar: true, searchbarPlaceholder: 'Search route'}"
          >
          <select v-model="routeid" name="routeid">
           <option
              v-for="prob in comp.problems" 
              :key="prob.id" 
              :value="prob.id"
            >
            {{ prob.pivot.num }}. {{ prob.tag }} {{ prob.wallchar }} {{ prob.colour.name }} 
           </option>
          </select>
            <!--
            <template #title>
            {{ prob.pivot.num }}. {{ prob.tag }} {{ prob.wallchar }} {{ prob.colour.name }} 
            </template>
            <template #header>
            max points: {{ prob.pivot.max_points }}, {{ prob.routetype }}, {{ prob.pivot.bound }}
            </template>
            -->
          </f7-list-item>
        </f7-list>
      
    </div>

    
      <label class="font-bold" for="sport_points"
        >Points from route (eg. 5, 5+ or text TOP if top-out)</label
      >
      <div class="flex flex-row justify-center mx-1">
        <f7-input
          class="font-bold border border-gray-500 text-center w-16 p-1 "
          type="text"
          name="sport_points"
          id="sport_points"
          size="5"
          v-model:value="sportPoints"
        />
        <button
          @click="sportPoints = 'TOP'"
          type="button"
          class="border border-black mx-1 bg-blue-400 px-2 py-1 "
        >
          TOP
        </button>
      </div>
      <label class="font-bold my-2" for="timemin">Time</label>
      <div class="flex flex-row my-2 justify-center">
        <div class="mx-1">
          min<br />
          <f7-input
            type="text"
            class="font-bold border border-gray-500 text-center w-16 p-1 "
            name="timemin"
            v-model:value="timemin"
            size="2"
          />
        </div>
        <div class="mx-1">
          secs<br />
          <f7-input
            class="font-bold border border-gray-500 text-center w-16 p-1 "
            type="text"
            name="timesec"
            v-model:value="timesec"
            size="2"
          />
        </div>
        <div class="mx-1">
          OR input time in seconds<br />
          <f7-input
            type="text"
            class="font-bold border border-gray-500 text-center w-16 p-1 "
            name="time_manual"
            v-model:value="time_manual"
            size="4"
          />
        </div>
      </div>
      <div id="timer_started"></div>
      <div id="timer_now"></div>
      <div class="flex flex-row justify-center">
        <button @click="timerStart" class="border border-black mx-1 px-2 py-1 text-sm bg-green-500" type="button" id="timer_start" > Start </button>
        <button @click="timerStop" class="border border-black mx-1 px-2 py-1 text-sm bg-orange-500" type="button" id="timer_stop" > Stop </button>
        <button @click="timerReset" class="border border-black mx-1 px-2 py-1 text-sm bg-red-500" type="button" id="timer_reset" > Reset </button>
      </div>
    
    <br />

    <div class="mt-5 mb-1 py-1 flex flex-col">
      <button @click="addSportAscent" class="button px-8 py-3 my-1" type="button"> Add ascent </button>
      <button @click="() => fetchAscents(comp.id)" class="text-blue-400 px-8 py-3 my-1" type="button"> Fetch ascents </button>
    </div>
      <ul v-if="ascents.length > 0" class="my-2">
        <li
          v-for="asc in ascents"
          :key="asc.id"
          class="my-1 border border-gray-700 mx-4 text-center py-1 px-2 bg-blue-400 rounded-lg"
        >
          <div>
            Route {{ asc.num }}: Points {{ asc.sport_points }},
            {{ asc.sport_timer_secs }} secs
            <a @click.prevent="removeAscent(asc.tickid)" class="font-bold text-red-500"
              >X</a
            >
          </div>
        </li>
      </ul>
      <div v-else class="text-center">No ascents fetched</div>
    
  </f7-block>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import useDebouncedRef, { debounce } from '@helpers/debouncedRef.js'
import { toaster, alert } from '@js/helpers/notifications.js'
import { computed, onMounted, ref } from 'vue'
import api from '@js/api.js';
const { t } = useI18n()
const clearSearch= () => {
 search.value = ''
 hits.value = [] 
}

const props = defineProps({
  comp: Object,
})
const removeAscent = (tickid) => {
  const payload = {
    compid : props.comp.id,
    tickid
  }
  api.removeCompAscent(payload)
  .then((ret) => {
      fetchAscents(props.comp.id)
  })
}
const fetchAscents = (compid ) => {
  const payload = {
    compid ,
    contenderid  : contid.value
  }
    api.fetchCompAscents(payload)
    .then((data) => {
      ascents.value = data
    })
}
const apiurl = 'https://www.problemator.fi'
const selected = ref(null)
const search = ref('')
const addSportAscent = () => {
  if (isNaN(parseInt(contid.value))) {
    alert('Cannot add without contender id')
    return
  }
  if (routeid.value == null) {
    alert('Cannot add without route id(s)')
    return
  }
  // Just send sport_timer_secs
  let sportTimerSecs = 0
  
  if (!isNaN(time_manual.value) && time_manual.value != "" && time_manual.value != 0) {
    sportTimerSecs = parseInt(time_manual.value)
  } else {
    sportTimerSecs = (parseInt(timemin.value) * 60) + parseInt(timesec.value)
  }
  const params = {
    contender: contid.value,
    problemid: [routeid.value],
    sport_points: sportPoints.value,
    sport_timer_secs : sportTimerSecs,
    comp_id: props.comp.id,
  }

    api.addCompAscent(params)
    .then((ret) => {
      ascents.value = ret.ascents
    })
    .catch((err) => {
      alert(err)
    })
}

let t2 = null
var saveTime = (time, type) => {
  // Save timer start also to db... In case of login craziness.
  const act = 'sport_timer_' + type
  const opt = {
    contender: contid.value,
    routeid: routeid.value,
    frm_compid: props.comp.id,
    act: act,
    time: time,
  }
  localStorage.setItem(type, JSON.stringify(opt))
}

const climberTimer = () => {
  showTime(start.value)
  t2 = setTimeout(climberTimer, 1000)
}

const showTime = (start) => {
  var now = new Date()
  var time = now.getTime()

  var secs = (time - start) / 1000
  var mins = Math.floor(secs / 60)
  var secs = Math.round(secs % 60, 0)
  timemin.value = mins
  timesec.value = secs
}

const timerStart = () => {
  var now = new Date()
  var time = now.getTime()
  start.value = time
  saveTime(start.value, 'start')
  t2 = setTimeout(climberTimer, 1000)
}

const timerStop = () => {
  clearTimeout(t)
  // Save stop time.
  var now = new Date()
  var time = now.getTime()
  stop.value = time
  saveTime(stop.value, 'stop')
  timerReset(false)
}

const timerReset = (clearTime = true) => {
  start.value = 0
  stop.value = 0
  localStorage.removeItem('start')
  localStorage.removeItem('stop')
  localStorage.removeItem('reset')
  clearTimeout(t2)
  if (clearTime) {
    timemin.value = ''
    timesec.value = ''
  }
}

const ascents = ref([])
const start = ref(null)
const timesec = ref('')
const time_manual = ref('')
const timemin = ref('')
const routeid = ref(null)
const sportPoints = ref(0)
const contid = ref(null)
const timeSecs = ref(0)
const hits = ref([])
const clearContender = () => {
  selected.value = null
  contid.value = null
  search.value = null
  ascents.value = []
}
const selectContender = (hit) => {
  if (hit != null) {
    console.log(hit.nimi)
    selected.value = hit
    search.value = hit.nimi
    contid.value = hit.id
    hits.value = []
  }
}
const fetchContender = debounce(() => {
  selected.value = null
  hits.value = []
    const payload = {
      compid : props.comp.id,
      term : search.value,
    }
    api.findContenderInComp(payload)
    .then((data) => {
      hits.value = data
    })
}, 200)
</script>
