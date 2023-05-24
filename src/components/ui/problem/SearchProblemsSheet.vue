<template>
  <div class="mt-4 mb-1 font-bold text-2xl text-center">
    {{ t('searchprob.find_a_route') }}
  </div>
  <div class="flex-grow">
    <div class="p-3">
      {{ t('searchprob.instructions') }}
    </div>
    <div class="flex flex-row w-full p-1">
      
      <div class="self-center w-full px-2">
        <f7-input :label="t('searchprob.search_for_problems')" class="w-full mt-1 px-2 py-2 border border-gray-300 h-10 " @input:clear="onClearSearchText" @keyup="searchProblemTextChanged" v-model="searchProblemText" type="text" clear-button :placeholder="t('searchprob.search_for_problems')" />
      </div>
    </div>
    <div class="text-center bg-gray-700 py-1" v-if="searching"><i class="fa fa-spinner fa-spin"></i> Searching...</div>
    <div class="my-1 text-small text-center">
      {{ t('searchprob.hits', problems.length) }}
    </div>
    <f7-list media class="my-0 max-h-96 overflow-auto" v-if="problems.length > 0">
      <li v-if="problems.length == 0" :title="t('searchprob.no_hits')"></li>
      <search-hit-item @start-navigate="onStartNavigate" :problem="p" v-for="p in problems" :key="p.id"></search-hit-item>
    </f7-list>
  </div>
  <div class="">
    <button v-if="problems.length > 0" @click="clearSearch" class="px-8 py-2 mx-auto w-11/12 bg-orange-500 text-white block">
      {{ t('global.clear_search_action') }}
    </button>
    <button @click="$emit('close')" class="px-8 py-2 w-11/12 mx-auto bg-red-500 text-white block">
      {{ t('global.close_action') }}
    </button>
    <br class="block my-4 " />
  </div>
</template>


<script setup>
import { useI18n } from 'vue-i18n'
import {  computed, ref } from 'vue'
import { debounce } from '@js/helpers'
import { useStore } from 'vuex'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'
const store = useStore()
const props = defineProps({
  opened: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'clear'])
const { t, tc } = useI18n()
const gymid = computed(() => store.state.gymid)
const searchProblemText = ref('')
const searching = ref(false)
const problems = ref([])
const qrReaderOpened = ref(false)
const onReadQRCode = (code) => {
  debugger
}
const openQRReader = () => {
  qrReaderOpened.value = true
  // Emit close for the sheet
  emit('close')
}
const onStartNavigate = (problem, sec) => {
  searchProblemText.value = "" // empty search text when selection is done.
  emit('close')
  emit('start-navigate', problem)
  emit('clear')
}
const clearSearch = () => {
  searchProblemText.value = ""
  problems.value = []
  emit('clear')
}
const searchProblemTextChanged = debounce((el) => {
  searching.value = true
  const value = el.target.value
  searchProblemText.value = value
  if (searchProblemText.value != '') {
    const payload = {
      text: searchProblemText.value,
      gymid: gymid.value,
    }
    api.searchProblems(payload).then((data) => {
      problems.value = data.problems
      searching.value = false
    })
  }
}, 400)
const onClearSearchText = () => {
  searchProblemText.value = ''
  problems.value = []
}
</script>

