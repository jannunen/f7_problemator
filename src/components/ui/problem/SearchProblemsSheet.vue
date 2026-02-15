<template>
  <div class="p-4">
    <div class="text-lg font-bold text-center mb-1" style="color: var(--p-text);">
      {{ t('searchprob.find_a_route') }}
    </div>
    <p class="text-sm text-center mb-3" style="color: var(--p-text-muted);">
      {{ t('searchprob.instructions') }}
    </p>
    <div class="mb-3">
      <div class="search-input-wrap">
        <span class="material-icons search-input-icon">search</span>
        <input
          ref="searchInput"
          class="p-input search-input-field"
          @input="onSearchInput"
          :value="searchProblemText"
          type="text"
          :placeholder="t('searchprob.search_for_problems')"
        />
        <button v-if="searchProblemText.length > 0" class="search-input-clear" @click="onClearSearchText">
          <span class="material-icons" style="font-size: 18px;">close</span>
        </button>
      </div>
    </div>
    <div v-if="searching" class="text-center py-2 text-sm" style="color: var(--p-text-muted);">
      <div class="p-spinner" style="width: 20px; height: 20px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 6px;"></div>
      Searching...
    </div>
    <div class="text-center text-xs mb-2 p-text-muted">
      {{ t('searchprob.hits', problems.length) }}
    </div>
    <f7-list media class="my-0 max-h-96 overflow-auto" v-if="problems.length > 0">
      <search-hit-item @start-navigate="onStartNavigate" :problem="p" v-for="p in problems" :key="p.id"></search-hit-item>
    </f7-list>
  </div>
  <div class="px-4 pb-4 flex flex-col gap-2">
    <button v-if="problems.length > 0" @click="clearSearch" class="p-btn p-btn--block" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.25); color: #fcd34d;">
      {{ t('global.clear_search_action') }}
    </button>
    <button @click="$emit('close')" class="p-btn p-btn--danger p-btn--block">
      {{ t('global.close_action') }}
    </button>
    <div class="h-4"></div>
  </div>
</template>


<script setup>
import { useI18n } from 'vue-i18n'
import {  computed, ref } from 'vue'
import { debounce } from '@js/helpers'
import { useStore } from 'vuex'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'
import api from '@js/api.js'
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
const onSearchInput = (el) => {
  searchProblemText.value = el.target.value
  doSearch()
}
const doSearch = debounce(() => {
  if (searchProblemText.value != '') {
    searching.value = true
    const payload = {
      text: searchProblemText.value,
      gymid: gymid.value,
    }
    api.searchProblems(payload).then((data) => {
      problems.value = data.problems
      searching.value = false
    })
  } else {
    problems.value = []
  }
}, 400)
const onClearSearchText = () => {
  searchProblemText.value = ''
  problems.value = []
}
</script>
<style scoped>
.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input-icon {
  position: absolute;
  left: 10px;
  font-size: 20px;
  color: var(--p-text-dim);
  pointer-events: none;
  z-index: 1;
}
.search-input-field {
  padding-left: 38px;
  padding-right: 36px;
}
.search-input-clear {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: var(--p-text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.search-input-clear:hover {
  color: var(--p-text);
}
</style>
