<template>
<f7-block v-if="comp != null" class="flex flex-col align-center items-center justify-center p-2">
  <button @click="showCollapse=!showCollapse" class="btn-primary btn_small" >Share page to other judges</button>
  <div v-if="showCollapse" class="collapse">
    <img :src="getShareURL" />
  </div>
  {{ t('comps.comp_type') }} : {{ comp.tyyppi }}
  <BoulderJudging v-if="isBoulderingComp" :comp="comp"  /> 
  <SportJudging v-if="isSportComp" :comp="comp" /> 
</f7-block>
</template>
<style >
.button {
  @apply mx-1 py-2 px-4 bg-indigo-500 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
}
.redButton {
  @apply mx-1 py-2 px-3 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75;
}
</style>
<script setup>
import store from '@js/store.js'
import { computed,onMounted,ref } from 'vue'
import {useStore} from 'framework7-vue'
import axios from 'axios'
import BoulderJudging from './BoulderJudging.vue'
import SportJudging from './SportJudging.vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { confirm, toaster } from '@helpers/notifications.js'
const { t } = useI18n()

const props = defineProps({
  compid : Number,
})
const comp = useStore('competition')
store.dispatch('getCompetition',props.compid)
const showCollapse = ref(false)
const routeIds = ref()
const sic = ref(null)
const contid = ref(null)
const ascents = ref([])
const hits = ref([])
const selected = ref(null)
const search = ref("")
const urlSearchParams = new URLSearchParams(window.location.search);
const getShareURL = computed(() => {
  return 'https://chart.googleapis.com/chart?cht=qr&chl=https://pwa.problemator.fi/competitions/'+compid.value+'/judging&chs=150x150'
})


const isBoulderingComp = computed(() => {
  if (comp.value == null || comp.value.tyyppi == null) {
  return false
  }
  if ( comp.value.tyyppi != 'sport') { 
    return true;
  }
  if (comp.value.tyyppi.match(/boulder/)) {
    return true
  }
  return false
})

const isSportComp = computed(() => {
  if (comp.value == null || comp.value.tyyppi == null) {
  return false
  }
  if ( comp.value.tyyppi == 'sport') {
    return true
  }
  if (comp.value.tyyppi.match(/sport/)) {
    return true
  } 
  return false
})

const count = ref(0)
</script>
