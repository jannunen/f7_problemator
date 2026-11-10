<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import useDebouncedRef, { debounce } from '@helpers/debouncedRef.js'
import { useStore } from 'vuex'
import axios from 'axios'
import { checkpointOptions, checkpointDisplayLabel, CHECKPOINT_TYPES } from '@helpers/checkpoints.js'
import { toaster } from '@helpers/notifications.js'
const { t } = useI18n()
const store = useStore()
const props = defineProps(['comp'])
const contid = ref(null)
const selected = ref(null)
const ascents = ref([])
const routeIds = ref('')
const triesTop = ref(1)
const triesBonus = ref(1)
const hits = ref([])
const search = ref('')
const apiurl = 'https://pwa.problemator.fi'
const isCheckpointComp = computed(() => CHECKPOINT_TYPES.includes(props.comp?.tyyppi))
const cpProblemId = ref('')
const cpProblem = computed(() => (props.comp.problems ?? []).find((p) => p.id == cpProblemId.value) ?? null)
const cpChoices = computed(() => checkpointOptions(cpProblem.value))
const cpProblems = computed(() =>
  [...(props.comp.problems ?? [])].sort((a, b) => parseInt(a.pivot.num) - parseInt(b.pivot.num))
)
const pickCheckpoint = (opt) => {
  if (isNaN(parseInt(contid.value))) {
    alert('Cannot add without contender id')
    return
  }
  if (cpProblem.value == null) {
    alert(t('judging.pick_problem'))
    return
  }
  if (opt.value === 'top') {
    // Reaching the top is an ordinary judged ascent (tries etc.) through the
    // same CompetitionsController@addAscent route; toast only once it succeeded.
    store
      .dispatch('addTopJudging', {
        compid: props.comp.id,
        contender: contid.value,
        problemid: cpProblem.value.id,
        tries_top: triesTop.value,
        tries_bonus: triesBonus.value,
      })
      .then(() => toaster(t('judging.top_recorded')))
      .catch((err) => toaster(err?.response?.data?.message || err?.message || t('judging.top_failed')))
    return
  }
  // Capture at send-time: the judge may switch cpProblemId (and therefore
  // cpChoices) before this request resolves, which would otherwise label the
  // toast with the NEW problem's checkpoints instead of the recorded one.
  const choicesAtCall = cpChoices.value
  store
    .dispatch('addCheckpointJudging', {
      compid: props.comp.id,
      contender: contid.value,
      problemid: cpProblem.value.id,
      checkpoint: opt.value,
    })
    .then((ret) => {
      // Show what the server stored (it keeps the highest), not what was tapped.
      if (ret && ret.ok === true && ret.checkpoint != null) {
        const label = checkpointDisplayLabel(choicesAtCall, ret.checkpoint, t)
        // escapeParameter: the label is routesetter-authored free text, validated
        // server-side only as "a string, at most 40 chars" (no HTML stripping).
        // toaster() hands this straight to Framework7's notification, which renders
        // its subtitle as HTML without escaping, so an unescaped label would be a
        // stored XSS. escapeParameter HTML-entity-escapes the {label} interpolation
        // before the message is formatted, so a label like '<img onerror=...>' comes
        // out as literal text ('&lt;img onerror=...&gt;'), never as markup.
        toaster(t('judging.checkpoint_recorded_label', { label }, { escapeParameter: true }))
      } else {
        toaster(ret?.message || t('judging.checkpoint_failed'))
      }
    })
    .catch((err) => toaster(err?.response?.data?.message || err?.message || t('judging.checkpoint_failed')))
}
const clearSearch= () => {
 search.value = ''
 hits.value = [] 
}
const fetchAscents = () => {
  const url =
    apiurl +
    '/t/problemator/competitions/contender/_list_points/?format=json&contid=' +
    contid.value +
    '&compid=' +
    props.comp.id +
    '&spessukey=jekkukey'
  axios
    .get(url)
    .then((r) => r.data)
    .then((data) => {
      ascents.value = Object.keys(data.points).map((key) => data.points[key])
    })
}

const addAscent = () => {
  if (isNaN(parseInt(contid.value))) {
    alert('Cannot add without contender id')
    return
  }
  if (routeIds.value == '') {
    alert('Cannot add without route id(s)')
    return
  }
  const url =
    apiurl + '/t/problemator/competitions/contender/add_ascent/?spessukey=jekkukey'
  const params = {
    json: true,
    contender: contid.value,
    routeid: routeIds.value,
    tries_bonus: triesBonus.value,
    tries_top: triesTop.value,
    frm_compid: props.comp.id,
    comp_id: props.comp.id,
  }
  return axios
    .post(url, params)
    .then((r) => r.data)
    .then((data) => {
      console.log(data)
      ascents.value = Object.keys(data.points).map((key) => data.points[key])
    })
    .catch((err) => {
      console.log(err)
    })
}

const removeAscent = (tickid) => {
  const url =
    apiurl +
    '/t/problemator/competitions/problem/del_ascent/?tickid=' +
    tickid +
    '&compid=' +
    props.comp.id +
    '&spessukey=jekkukey'
  axios
    .get(url)
    .then((r) => r.data)
    .then((data) => {
      fetchAscents(props.comp.id, contid.value)
    })
}
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
  // Find  from local paidregistrations
  const contenders = props.comp.paidregistrations
  hits.value = contenders.filter((contender) => {
    const lower = search.value.toLowerCase()
    if (contender.etunimi.toLowerCase().includes(lower)) {
        return true
        }
    if (contender.sukunimi.toLowerCase().includes(lower)) {
        return true
      }
      return false

    })
      
  
}, 200)
</script>
<template>
  <h1 class="my-1 font-bold text-xl">Judging sheet - bouldering</h1>

  <form v-if="comp != null" action="" name="add_ascents" id="add_ascents">
    <h1 class="my-1 font-bold text-xl">{{ comp.compname }}</h1>

    <div class="my-2">
      Start writing any part of the contender name. Or use number in shirt. You can even
      use first letters of first AND last name.
    </div>

    <div>
      <div v-if="selected != null" class="font-bold text-center">
        {{ selected.id }} {{ selected.nimi }}
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
      <div
        v-if="hits.length > 0"
        class="relative m-2 border-2 rounded-md border-black bg-white w-11/12 h-1/2"
      >
        Choose a contender
        <ul>
          <li
            v-for="hit in hits"
            :key="hit.id"
            class="my-1 border border-gray-700 mx-4 text-center py-1 px-2 bg-blue-400"
          >
            <div @click="() => selectContender(hit)">
              {{ hit.name }} <small class="self-end">{{ hit.id }}</small>
            </div>
          </li>
          <li class="redButton my-2" @click="clearSearch" > Close </li>
        </ul>
      </div>
    </div>

    <div v-if="isCheckpointComp" class="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-md" data-test="checkpoint-picker">
      <select v-model="cpProblemId" class="w-full border border-black rounded-md p-2 mb-2">
        <option value="">{{ t('judging.pick_problem') }}</option>
        <option v-for="p in cpProblems" :key="p.id" :value="p.id">{{ p.pivot.num }} {{ p.tag }}</option>
      </select>
      <div v-if="cpProblem != null">
        <div class="text-sm font-bold mb-1">{{ t('judging.highest_point') }}</div>
        <div class="flex flex-row flex-wrap gap-2">
          <button
            v-for="opt in cpChoices"
            :key="opt.value"
            type="button"
            class="px-3 py-2 rounded text-sm font-bold text-white"
            :class="opt.value === 'top' ? 'bg-yellow-500' : 'bg-indigo-500'"
            @click="() => pickCheckpoint(opt)"
          >
            {{ checkpointDisplayLabel(cpChoices, opt.value, t) }} ({{ opt.points }})
          </button>
        </div>
      </div>
    </div>

    <f7-list v-if="!isCheckpointComp" no-hairlines-md class="mb-2 p-0">
      <f7-list-input
        label="Route numbers (comma separated)"
        type="text"
        clear-button
        v-model:value="routeIds"
      >
      </f7-list-input>
    </f7-list>

    <div class="flex flex-col">
      <div class="control-label" for="tries_top">Tries to top</div>
      <div class="flex flex-row justify-between">
        <input
          type="number"
          v-model="triesTop"
          class="font-bold border border-black text-center w-8 p-1"
          name="tries_top"
          size="3"
        />
        <button @click="triesTop = 0" type="button" class="button" value="0">0</button>
        <button @click="triesTop = 1" type="button" class="button" value="1">1</button>
        <button @click="triesTop = 2" type="button" class="button" value="2">2</button>
        <button @click="triesTop = 3" type="button" class="button" value="3">3</button>
        <button @click="triesTop = 4" type="button" class="button" value="4">4</button>
        <button @click="triesTop = 5" type="button" class="button" value="5">5</button>
      </div>
    </div>

    <div class="flex flex-col">
      <div class="control-label col-sm-2" for="tries_bonus">Tries to bonus</div>
      <div class="flex flex-row justify-between">
        <input
          v-model="triesBonus"
          class="font-bold border border-black text-center w-8 p-1"
          type="number"
          name="tries_bonus"
          size="3"
        />
        <button @click="triesBonus = 0" type="button" class="button" value="0">0</button>
        <button @click="triesBonus = 1" type="button" class="button" value="1">1</button>
        <button @click="triesBonus = 2" type="button" class="button" value="2">2</button>
        <button @click="triesBonus = 3" type="button" class="button" value="3">3</button>
        <button @click="triesBonus = 4" type="button" class="button" value="4">4</button>
        <button @click="triesBonus = 5" type="button" class="button" value="5">5</button>
      </div>
    </div>
    <div class="mt-5 py-1 flex flex-col">
      <button v-if="!isCheckpointComp" @click="addAscent" class="button px-8 py-3 my-1" type="button">
        Add ascent
      </button>
      <button
        @click="() => fetchAscents(comp.id, contid)"
        class="button px-8 py-3 my-1"
        type="button"
      >
        Fetch ascents
      </button>
    </div>
    <div v-if="ascents.length > 0">
      <ul class="my-2">
        <li
          v-for="asc in ascents"
          :key="asc.id"
          class="my-1 border border-gray-700 mx-4 text-center py-1 px-2 bg-blue-400 rounded-lg"
        >
          <div>
            Route: {{ asc.num }}, Tries top: {{ asc.tries }}, Tries bonus:
            {{ asc.tries_bonus }} {{ asc.sport_points }}
            <a @click.prevent="removeAscent(asc.tickid)" class="font-bold text-red-500"
              >X</a
            >
          </div>
        </li>
      </ul>
    </div>
  </form>
</template>
