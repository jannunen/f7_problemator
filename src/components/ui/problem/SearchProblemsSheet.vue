<template>
  <div class="mt-4 mb-1 font-bold text-2xl text-center">
    {{ t('searchprob.find_a_route') }}
  </div>
  <div class="flex-grow">
    <div class="p-3">
      {{ t('searchprob.instructions') }}
    </div>
    <div class="flex flex-row w-full p-1">
      <div class="mt-2 flex">
        <a
          sheet-open=".search-problems"
          open-in="sheet"
          class="w-20 h-20 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
        >
          <font-awesome-icon icon="qr_code" color="white" size="20px"></font-awesome-icon>
          <small>{{ t('searchprob.read_qr') }}</small>
        </a>
      </div>
      <div class="self-center w-full px-2">
        <input
          :label="t('searchprob.search_for_problems')"
          class="w-full px-2 py-2 border border-white h-14 "
          @input:clear="onClearSearchText"
          @keyup="searchProblemTextChanged"
          v-model="searchProblemText"
          type="text"
          :placeholder="t('searchprob.search_for_problems')"
        />
      </div>
    </div>
    <div class="my-1 text-small text-center">
      {{ t('searchprob.hits', problems.length) }}
    </div>
    <ul class="my-0">
      <li v-if="problems.length == 0" :title="t('searchprob.no_hits')"></li>
      <search-hit-item
        @start-navigate="onStartNavigate"
        :problem="p"
        v-for="p in problems"
        :key="p.id"
      ></search-hit-item>
    </ul>
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


<script>
import { useI18n } from 'vue-i18n'
import relativeTime from "dayjs/plugin/relativeTime";
import { onMounted, computed, ref } from 'vue'
import { debounce, getTagShort } from '@js/helpers'
import store from '@js/store.js'
import { useStore } from 'framework7-vue'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'
import axios from 'axios'
export default {
  props: {
    opened: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close','clear'],
  setup(props, context) {
    const { t,tc } = useI18n()
    const gymid = useStore('gymid')
    const searchProblemText = ref('')
    const problems = ref([])
    const onStartNavigate = (problem, sec) => {
      searchProblemText.value = "" // empty search text when selection is done.
      context.emit('start-navigate',problem)
    }
    const clearSearch = () => {
      searchProblemText.value = null
      problems.value = []
      context.emit('clear')
    }
    const searchProblemTextChanged = debounce((value) => {
      if (searchProblemText.value != '') {
        const payload = {
          text: searchProblemText.value,
          gymid: gymid.value,
        }
        api.searchProblems(payload).then((data) => {
          problems.value = data.problems
        })
      }
    }, 400)
    const onClearSearchText = () => {
      searchProblemText.value = ''
      problems.value = []
    }
    return {
      onStartNavigate,
      searchProblemText,
      searchProblemTextChanged,
      onClearSearchText,
      problems,
      clearSearch,
      t,
    }
  },
  components: {
    SearchHitItem,
  },
}
</script>

<style></style>
