 <script setup>
    import SearchProblemsSheet from "@components/ui/problem/SearchProblemsSheet.vue";
    import { useI18n } from 'vue-i18n'
    import { computed, ref } from 'vue'
    import store from '@js/store.js'
    import { useStore } from 'framework7-vue'
    const { t } = useI18n() 
    const props = defineProps({
        profile: Object,
    })
    const emits = defineEmits(['addtick'])
    const gym = useStore('gym')
    const ticksToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = gym?.problems;
      if (probs == null) {
          return 0
      }
      return probs.reduce((acc, prob) => {
        // Check if ticks are from today.
        acc += prob.myTicks.reduce((acc, tick) => {
          if (dayjs().isSame(dayjs(tick.tstamp),'date')) {
            acc++
          }
          return acc
        },0);
        return acc;
      }, 0);
    });

    const triesToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = gym?.problems;
      if (probs == null) {
          return 0
      }
      const triesToday = probs.reduce((acc, prob) => {
        acc += prob.myTicks.reduce((ticks, tick) => {
          // Check if ticks are from today.
          if (dayjs().isSame(dayjs(tick.tstamp),'date')) {
            ticks += parseInt(tick.tries);
          }
          return ticks;
        }, 0);
        return acc;
      }, 0);
      return triesToday;
    });

 </script>
 <template>
 <div class="my-2 text-center text-lg font-bold">{{ t("home.today") }}</div>
      <div class="flex flex-row justify-center mt-3">
        <div class="flex flex-col mx-4 text-center">
          <div class="text-5xl font-bold leading-8">{{ ticksToday }}<br /></div>
          <small class="mb-2">{{ t("home.ascents") }}</small>
          <div class="text-sm text-center leading-3">{{ triesToday }}</div>
          <small>{{ t("home.tries") }}</small>
        </div>
        <div class="mt-2">
          <button
            @click="emits('addtick')"
            class="w-14 h-14 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
          >
            <f7-icon material="add" color="white" size="20px"></f7-icon>
            <small>{{ t("home.add") }}</small>
          </button>
        </div>
      </div>
      </template>