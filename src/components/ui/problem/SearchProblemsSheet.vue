<template>
  <!-- A fixed-height sheet (see Home.vue) with its own internal layout rather
       than one tall scrolling column: the title/search stay put, the hit
       count and results scroll in the middle, and the action buttons stay
       reachable at the bottom instead of sliding away under a long list. -->
  <div class="sheet__root">
    <div class="sheet__header">
      <div class="text-lg font-bold text-center mb-1" style="color: var(--p-text);">
        {{ t('searchprob.find_a_route') }}
      </div>
      <p class="text-sm text-center mb-3" style="color: var(--p-text-muted);">
        {{ t('searchprob.instructions') }}
      </p>
      <div class="mb-1">
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
    </div>

    <div class="sheet__results">
      <div v-if="searching" class="text-center py-2 text-sm" style="color: var(--p-text-muted);">
        <div class="p-spinner" style="width: 20px; height: 20px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 6px;"></div>
        Searching...
      </div>
      <div class="text-center text-xs mb-2 p-text-muted">
        {{ t('searchprob.hits', problems.length) }}
      </div>
      <f7-list media class="my-0" v-if="problems.length > 0">
        <search-hit-item @start-navigate="onStartNavigate" :problem="p" v-for="p in problems" :key="p.id"></search-hit-item>
      </f7-list>
    </div>

    <div class="sheet__footer flex flex-col gap-2">
      <!-- The other half of "what did you climb". This sheet can only find
           problems a gym has set, which leaves a board session, a home wall or
           a spray-wall afternoon with nowhere to go from the one button a
           climber actually presses to log something. -->
      <button @click="$emit('log-session')" class="p-btn p-btn--block sheet__session">
        <span class="material-icons sheet__session-icon">grid_on</span>
        {{ t('board.entry') }}
      </button>

      <button v-if="problems.length > 0" @click="clearSearch" class="p-btn p-btn--block" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.25); color: #fcd34d;">
        {{ t('global.clear_search_action') }}
      </button>
      <button @click="$emit('close')" class="p-btn p-btn--danger p-btn--block">
        {{ t('global.close_action') }}
      </button>
    </div>
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
const emit = defineEmits(['close', 'clear', 'log-session'])
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
.sheet__root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sheet__header {
  flex: none;
  padding: 1rem 1rem 0;
}

/* flex: 1 1 auto alone still lets a flex item grow past its container to fit
   its content; min-height: 0 is what actually lets it stop at the container's
   edge and hand the rest off to overflow-y instead. */
.sheet__results {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem;
}

.sheet__footer {
  flex: none;
  padding: 0.75rem 1rem 1rem;
}

.sheet__session {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: transparent;
  border: 1px dashed var(--p-border-light);
  color: var(--p-text-secondary);
}

.sheet__session-icon { font-size: 18px; }

.search-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input-icon {
  position: absolute;
  left: 14px;
  font-size: 22px;
  color: var(--p-accent);
  pointer-events: none;
  z-index: 1;
}
/* This is the one field the whole sheet exists for, so it gets its own
   emphasis rather than the generic .p-input treatment every other field in
   the app uses: bigger, an accent-tinted border instead of a near-invisible
   one, and a placeholder that doesn't read as disabled. */
.search-input-field {
  padding: 0.8rem 36px 0.8rem 44px;
  font-size: 1rem;
  background: rgba(var(--p-accent-rgb), 0.06);
  border: 2px solid var(--p-border-accent);
}
.search-input-field::placeholder {
  color: var(--p-text-muted);
}
.search-input-field:focus {
  border-color: rgba(var(--p-accent-rgb), 0.5);
  background: rgba(var(--p-accent-rgb), 0.08);
}
.search-input-clear {
  position: absolute;
  right: 10px;
  /* Framework7's base CSS resets every <button> to width: 100%. With no
     width of its own, this one stretched to fill the input (absolute
     positioning with only `right` set sizes to shrink-to-fit UNLESS
     something else forces a width) and the icon inside it landed wherever
     flex centering put it — on top of the typed text instead of at the
     right edge. */
  width: auto;
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
