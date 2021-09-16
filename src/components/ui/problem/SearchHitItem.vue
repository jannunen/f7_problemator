<template>
  <f7-list-item @click="$emit('start-navigate')" :link="`/problems/` + problem.id" >
          <template #after>
            <div style="width: 100px" class="display-flex flex-direction-column">
              <small class="flex flex-row">
                <div class="flex flex-col">
                  <small>{{ getAfter(problem) }}</small>
                  {{ $t("home.by") }} {{ problem.author }}
                </div>
                <div v-if="problem.myProjects != null && problem.myProjects.length > 0">
                  <span
                    class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-600 rounded-full"
                    >P</span
                  >
                </div>
                <div v-else-if="problem.myTicks != null && problem.myTicks.length > 0">
                  <span
                    class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full"
                    >✓</span
                  >
                </div>
              </small>
            </div>
          </template>
          <template #title>
            <div class="flex flex-col">
              <strong class="margin-left margin-right" v-if="problem.c_like > 0">
                <f7-icon size="15" color="red" material="favorite"></f7-icon>
                {{ problem.c_like }}
              </strong>
              <small> {{ problem.ascentCount }} {{ $t("home.ascents") }}</small>
            </div>
          </template>
          <template #after-start> </template>
          <template #media>
            <div class="display-flex flex-direction-column">
              <div class="display-flex flex-direction-row">
                <round-badge :width="20" :bgColor="problem.colour.code"></round-badge>
                {{ getTagShort(problem.tag) }}
              </div>
            </div>
            <h4 style="width: 20px" class="font-bold margin-left no-margin">
              {{ getGrade(problem.routetype, problem.grade) }}
            </h4>
          </template>
        </f7-list-item>
</template>

<script>
import { debounce, getTagShort } from "@js/helpers";
import RoundBadge from "@components/ui/RoundBadge.vue";
import dayjs from 'dayjs'
export default {
  props: {
    problem: Object,
  },
  emits : ['start-navigate'],
  setup(props,context) {
    const getAuthor = (group) => {
      return group.ascentCount + " " + t("home.ascents");
    };
    const getAfter = (group) => {
      const date = dayjs(group.added);
      return date.fromNow();
    };
    const getTryTries = (problem) => {
      // Get info x tries in y session
      if (problem.myProjects != null) {
        const tries = problem.myProjects.reduce((acc, item) => {
          acc = acc + parseInt(item.tries);
          return acc;
        }, 0);
        return tries;
      }
      return null;
    };
    const getTrySessions = (problem) => {
      // Get session amount (== day counts as session)
      if (problem.myProjects != null) {
        const mySessions = new Set();
        problem.myProjects.forEach((item) => {
          const date = dayjs(item.tstamp);
          const formatted = date.format("YYYY-MM-DD");
          mySessions.add(formatted);
        });
        return mySessions.size;
      }
      return null;
    };

    const getGrade = (routetype, gradeObj) => {
      if (gradeObj == null) {
        return "N/A" / tore;
      }
      const grade = gradeObj.name;
      if (routetype == "boulder") {
        return grade.toUpperCase();
      }
      return grade.toLowerCase();
    };
    return {
      getTryTries,
      getTrySessions,
      getAuthor,
      getTagShort,
      getAfter,
      getTagShort,
      getGrade,
    };
  },
  components : {
      RoundBadge,
  },
};
</script>

<style></style>
