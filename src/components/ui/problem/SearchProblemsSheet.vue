<template>
  <f7-sheet
    class="search-problems"
    back-drop
    style="height:auto; --f7-sheet-bg-color: #fff;"
    position="top"
    :sheet-close="$emit('closed')"
    :opened="opened"
  >
    <f7-page-content>
      <div class="mt-4 mb-1 font-bold text-2xl text-center">{{ $t("searchprob.find_a_route") }}</div>
      <f7-block class="flex flex-row w-full">
        <div class="mt-2 flex ">
          <f7-link
            sheet-open=".search-problems"
            open-in="sheet"
            class="w-20 h-20 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
          >
            <f7-icon material="qr_code" color="white" size="12px"></f7-icon>
            <small>{{ $t("searchprob.read_qr") }}</small>
          </f7-link>
        </div>
        <div class="self-center  w-full">
          <f7-input
            :label="$t('searchprob.search_for_problems')"
            class="px-2 py-2 mx-2"
            :outline="true"
            @keyup="searchProblemTextChanged"
            v-model:value="searchProblemText"
            type="text"
            :placeholder="$t('searchprob.search_for_problems')"
            clear-button
          ></f7-input>


        </div>
        
      </f7-block>
      <div class="m-0 text-small text-center">{{ problems.length }} hits</div>
        <f7-list class="my-0">
          <list-item v-if="problems.length == 0" :title="$t('searchprob.no_hits')"></list-item>
           <search-hit-item @start-navigate="$emit('close')" :problem="p" v-for="p in problems" :key="p.id" ></search-hit-item>
        </f7-list>
      <div class=" m-2">
          <button @click="$emit('close')" class="button bg-red-500 text-white">
            {{ $t("global.close_action") }}
          </button>
        </div>
    </f7-page-content>
  </f7-sheet>
</template>

<script>
import { onMounted, computed, ref } from "vue";
import { debounce, getTagShort } from "@js/helpers";
import { api } from '@js/store/actions'
import SearchHitItem from '@components/ui/problem/SearchHitItem.vue'
import axios from 'axios'
export default {
  props: {
    opened: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["closed"],
  setup() {
    const searchProblemText = ref("")
    const problems = ref([])
    const searchProblemTextChanged = debounce((value) => {
      axios.post(api+"problem/search",{
        text : searchProblemText.value ,
        gymid : localStorage.gymid,
      })
      .then(r=>r.data)
      .then(data => {
        problems.value = data.problems

      })

    },400)
    return {
      searchProblemText,
      searchProblemTextChanged,
      problems,
    }
  },
  components : {
    SearchHitItem,
  }
};
</script>

<style></style>
