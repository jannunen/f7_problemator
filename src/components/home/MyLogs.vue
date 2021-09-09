<template>
  <div class="mt-8 m-4 rounded-md raised shadow-lg p-4 bg-white">
    <div class="font-bold text-lg" style="color: #3bb273">{{ $t('mylogs.my_log') }}</div>
    <div class="grid grid-cols-3">
      <div class="flex flex-col items-end mr-3">
        <div class="text-5xl">{{ getLatestSessionCount }}</div>
        <div>{{ $t("home.sessions") }}</div>
        <div class="text-5xl">{{ getLatestProblemCount }}</div>
        <div>{{ $t("home.routes") }}</div>
      </div>
      <div class="flex flex-col justify-between col-span-2">
        <div>
          <last-ascents
            :ascents="getAscentsByGrade"
            :grades="grades"
            :days="30"
            :type="showOfType"
          ></last-ascents>
        </div>
        <div v-if="!showSelector">
          {{ $tc("home.last_n_days_boulder", lastDays) }}
        </div>
      </div>
      <div v-if="showSelector" class="flex flex-col col-span-3 my-2 items-center">
        <div class="flex flex-row justify-around my-1">
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'boulder'"
              name="showOfType"
              value="boulder"
              @change="() => changeOfType('boulder')"
            ></f7-radio>
            {{ $t("mylogs.boulder") }}
          </div>
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'sport'"
              name="showOfType"
              value="sport"
              @change="() => changeOfType('sport')"
            ></f7-radio
            >{{ $t("mylogs.sport") }}
          </div>
          <div>
            <f7-radio
              class="mx-1"
              :checked="showOfType == 'all'"
              name="showOfType"
              value="all"
              @change="() => changeOfType('all')"
            ></f7-radio
            >{{ $t("mylogs.all") }}
          </div>
        </div>
        <div>Last {{ lastDays }} days</div>
      </div>
    </div>
  </div>
</template>

<script>
import LastAscents from "@components/home/LastAscents.vue";
import { useStore } from "vuex";
import { computed, ref } from "vue";
import { getAscentsByGrade } from "@js/componentHelpers.js";
import dayjs from 'dayjs'

export default {
  props: {
    lastDays: {
      type: Number,
      default: 30,
    },
    showSelector: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const store = useStore();
    const grades = computed(() => store.state.grades);
    const problems = computed(() => store.state.gym.problems);
    const showOfType = ref("boulder");
    const changeOfType = (type) => {
      showOfType.value = type;
    };
    const getLatestProblemCount = computed(() => {
        const deadline = dayjs().subtract(props.lastdays,'day')
        const problemDates = new Set()
        problems.value.forEach((prob) => {
            // Calculating last problems within 'lastDays' must be calculated
            // so that we check every tick and if they fit into the time span,
            // set the problemid to Set and it ends up being unique
            prob.myTicks.forEach((tick) => {
                const ts = dayjs(tick.tstamp).format("YYYY-MM-DD")
                if (dayjs(tick.tstamp).isAfter(deadline)) {
                    problemDates.add(ts)
                }
            })
        })
        return problemDates.size
    })
    const getLatestSessionCount = computed(() => {
        // Sessions are defined as unique days (we don't count morning and evening session as two)
        // Easiest way is to use set, as it's unique in nature. So let's get to it.
        const sessions = new Set()
        problems.value.forEach((problem) => {
            // Then go through each tick and put the date into the set.
            const deadline = dayjs().subtract(props.lastdays,'day')
            problem.myTicks.forEach(tick => {
                const tickDate = dayjs(tick.tstamp).format("YYYY-MM-DD")
                // Now check if the tick is within the last "lastDays" days
                if (dayjs(tick.tstamp).isAfter(deadline)) {
                    sessions.add(tickDate)
                }
            }) 
            problem.myProjects.forEach(tick => {
                const tickDate = dayjs(tick.tstamp).format("YYYY-MM-DD")
                if (dayjs(tick.tstamp).isAfter(deadline)) {
                    sessions.add(tickDate)
                }
            }) 
        }) 
        return sessions.size
    });

    return {
      grades,
      getAscentsByGrade,
      changeOfType,
      showOfType,
      getLatestProblemCount,
      getLatestSessionCount,
    };
  },
  components: {
    LastAscents,
  },
};
</script>

<style>
</style>