<script setup>
import { useI18n } from 'vue-i18n'
import { debounce, getTagShort } from '@js/helpers'
import {  computed, ref, onMounted } from 'vue'
import RoundBadge from "@components/ui/RoundBadge.vue";
import TickList from "@components/ui/problem/TickList.vue";
import MyTicks from '@components/problem/MyTicks.vue'
import AddTick from '@components/problem/AddTick.vue'
import LeftDetails from '@components/problem/LeftDetails.vue'
import RightDetails from '@components/problem/RightDetails.vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import store from '@js/store.js'
import { useStore } from 'framework7-vue'
dayjs.extend(LocalizedFormat);
dayjs.extend(relativeTime)
const { t } = useI18n()
const props = defineProps({
  problem: Object,
})
const { problem } = props
const problems = useStore('problems')
onMounted(() => {
  // Load additional details and merge to problem
 store.dispatch("getProblemDetails", props.problem.id);
})
const problemDetails = computed(() => {
    // Merge parameter problem and store problem
    const aProblem = problems.value[problem.id]
    debugger
    if (aProblem != null) {
        const mergedProblem = {...problem, ...aProblem}
        return mergedProblem
    }
    return problem
})
</script>
<template>
  <f7-popup class="demo-popup" :opened="true" @popup:closed="popupOpened = false">
    <f7-page>
      <f7-navbar :title="t('problem.problem_details')">
        <f7-nav-right>
          <f7-link popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <div class="mt-2">
        
          <div v-if="problem != null && problem.id != null" class="m-0 p-0">
            <!-- Details title -->
            <h2 class="flex flex-row justify-center font-bold text-xl">
              <span v-if="problem.routetype == 'sport'">
                {{ t('problem.route ') }}
              </span>
              <span v-else>
                {{ t('problem.problem') }}
              </span>
              &nbsp;{{ getTagShort(problem.tag) }}
            <small class="mx-2 pt-1 text-sm text-gray-700" ><small>#{{ problem.id }}</small></small >
            </h2>

            <!-- problem details -->
            <div class="grid grid-cols-3 gap-4 my-3">
              <left-details :problem="problemDetails"></left-details>
              <right-details :problem="problemDetails"></right-details>
            </div>

            <!-- top part ends -->
          </div>
          <div class="m-2">
            <f7-button
              @click="addTickSheetOpened = true"
              class="uppercase block text-center button py-2 h-12 px-4 bg-green-500 text-white"
            >
              {{ t('problem.btn_add_tick') }}
            </f7-button>
          </div>

          <!--bottom sheet -->
          <add-tick
            v-if="problem != null"
            :problem="problem"
            :tick="tick"
            :opened="addTickSheetOpened"
          ></add-tick>
        
      </div>
    </f7-page>
  </f7-popup>
</template>
