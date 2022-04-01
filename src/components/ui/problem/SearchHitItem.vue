<template>
  <li
    @click="$emit('start-navigate',problem)"
    class="w-full px-1 py-2"
  >
    <div class="flex flex-row w-full justify-between">
        <div class="w-8 mt-2">
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
        </div>

      <div class="media flex-start w-16">
        <div class="flex flex-col justify-center items-center">
          <round-badge :width="20" :bgColor="problem.colour.code"></round-badge>
          {{ getTagShort(problem.tag) }}
        </div>
      </div>
      <div class="flex-start w-16">
        <h4 style="width: 20px" class="font-bold margin-left no-margin text-2xl">
          {{ getGrade(problem.routetype, problem.grade) }}
        </h4>
      </div>

      <div class="title flex-grow">
        <div class="flex flex-col">
          <div class="h-6">
            <strong class="margin-left margin-right" v-if="problem.c_like > 0">
              {{ problem.c_like }}
              <font-awesome-icon
                :style="{ color: 'red' }"
                icon="heart"
              ></font-awesome-icon>
            </strong>
          </div>
          <small> {{ problem.ascentCount }} {{ t('home.ascents') }}</small>
        </div>
      </div>

      <div class="after flex flex-col justify-between p-1">
        <div class="flex flex-row">
          <div class="flex flex-col">
            <small>{{ getAfter(problem) }}</small>
            <div class="flex flex-row">{{ t('home.by') }} {{ problem.author }}</div>
          </div>
        </div>
      </div>
    </div>
    <hr class="w-11/12 mx-auto divide-slate-700/25 "  />
  </li>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { debounce, getTagShort } from '@js/helpers'
import RoundBadge from '@components/ui/RoundBadge.vue'
import dayjs from 'dayjs'
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
export default {
  props: {
    problem: Object,
  },
  emits: ['start-navigate'],
  setup(props, context) {
    const { t,tc } = useI18n()

    const getAuthor = (group) => {
      return group.ascentCount + ' ' + t('home.ascents')
    }
    const getAfter = (group) => {
      const date = dayjs(group.added)
      return date.fromNow()
    }
    const getTryTries = (problem) => {
      // Get info x tries in y session
      if (problem.myProjects != null) {
        const tries = problem.myProjects.reduce((acc, item) => {
          acc = acc + parseInt(item.tries)
          return acc
        }, 0)
        return tries
      }
      return null
    }
    const getTrySessions = (problem) => {
      // Get session amount (== day counts as session)
      if (problem.myProjects != null) {
        const mySessions = new Set()
        problem.myProjects.forEach((item) => {
          const date = dayjs(item.tstamp)
          const formatted = date.format('YYYY-MM-DD')
          mySessions.add(formatted)
        })
        return mySessions.size
      }
      return null
    }

    const getGrade = (routetype, gradeObj) => {
      if (gradeObj == null) {
        return 'N/A' / tore
      }
      const grade = gradeObj.name
      if (routetype == 'boulder') {
        return grade.toUpperCase()
      }
      return grade.toLowerCase()
    }
    return {
      getTryTries,
      getTrySessions,
      getAuthor,
      getTagShort,
      getAfter,
      getTagShort,
      getGrade,
      t,
    }
  },
  components: {
    RoundBadge,
  },
}
</script>

<style></style>
