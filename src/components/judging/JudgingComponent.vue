<template>
<f7-block v-if="comp != null" class="flex flex-col align-center items-center justify-center p-2">
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
import { watch, computed,onMounted,ref } from 'vue'
import { useStore } from 'vuex'
import BoulderJudging from './BoulderJudging.vue'
import SportJudging from './SportJudging.vue'
import { useI18n } from 'vue-i18n'
const store = useStore()
const { t } = useI18n()

const props = defineProps({
  compid : Number,
})
const comp = computed(() => store.state.competition)
const isAuthenticated = computed(() => store.state.isAuthenticated)

watch(isAuthenticated, (newValue) => {
  if (newValue) {
    store.dispatch('getCompetition',props.compid)
  }
})

const showCollapse = ref(false)
const routeIds = ref()
const sic = ref(null)
const contid = ref(null)
const ascents = ref([])
const hits = ref([])
const selected = ref(null)
const search = ref("")
const urlSearchParams = new URLSearchParams(window.location.search);


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
