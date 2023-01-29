<template>
  <f7-popup v-model:opened="opened">
    <f7-page>
      <f7-navbar title="Top10 ascents for ranking">
        <f7-nav-right>
          <f7-link @click="emit('close')" popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <f7-block v-if="loading" class="text-center">
        <f7-block-title><i class="fa fa-spinner fa-spin"></i> Loading...</f7-block-title>
      </f7-block>
      <f7-block class="m-0" v-if="climber_id != null && !loading">
        <h2 class="text-2xl uppercase my-2 text-center font-bold">{{  props.first }} {{ props.last }}</h2>
        <div class="my-1 py-2 text-center px-4 bg-blue-500 font-bold uppercase w-full">
          <a href="#" class="" :link="climberProfileLink(climber_id)">Open profile</a>
        </div>

        <div class="m-0" v-if="ranking != null && ranking.id != null">
          <f7-block-title class="px-2"
            >Rank consists of {{ ranking.problems.length }} problem(s)</f7-block-title
          >
          <f7-list problem-list>
            <f7-list-item
              @swipeout:deleted="(evt) => onDeleted(problem, j)"
              v-for="(problem, index) in ranking.problems"
              :key="problem.id"
            >
              <template #media>
                <div class="flex flex-col items-center">
                  {{ index + 1 }}.<br /><span class="font-bold">{{
                    right(problem.tag, 4)
                  }}</span>
                </div>
              </template>
              <template #title>
                <div class="flex flex-row">
                  <span class="px-1 pt-1 text-2xl font-bold w-16">{{
                    problem.grade.name
                  }}</span>
                  <div class="flex flex-col">
                    <div class="flex">
                      <div class="ps-2">
                        <span class="text-green-500">{{
                          getFirstTickTimestamp(problem)
                        }}</span>
                        @{{ problem.gym.name }}
                      </div>
                    </div>
                    <div class="flex flex-row">
                      <strong>{{ problem.routetype }}</strong>
                      <span class="px-1"> | base score: {{ problem.grade.score }} </span>
                    </div>
                  </div>
                </div>
              </template>
              <template #after>
                <div class="flex flex-col">
                  <div class="text-right font-bold">
                    {{ problem.total_tries }}
                    <span>{{ t('ranking.tries') }}</span>
                  </div>

                  <div class="font-bold text-right text-yellow-400">
                    {{ problem.grade.score }}
                    {{ getChange(problem, true) }}
                    = {{ getPoints(problem) }}
                  </div>
                </div>
              </template>
            </f7-list-item>
            <f7-list-item>
              <template #after>
                <div class="text-yellow-400 font-bold text-lg">
                  {{ ranking.points }}
                </div>
              </template>
            </f7-list-item>
            <f7-list-item>
              <template #title>
                <div class="flex flex-col">
                  <div>Average grade based on grades</div>
                </div>
              </template>
              <template #after>
                <div class="text-yellow-400 font-bold text-lg">
                  {{ estimateGrade(getScore(ranking.problems), grades) }}
                </div>
              </template> </f7-list-item
            ><f7-list-item>
              <template #title>
                <div class="flex flex-col">
                  <div>Average grade based on ascent scores</div>
                </div>
              </template>
              <template #after>
                <div class="text-yellow-400 font-bold text-lg">
                  {{ estimateGrade(ranking.points, grades) }}
                </div>
              </template>
            </f7-list-item>
          </f7-list>
        </div>
        <div v-else>No ascents</div>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { watch, ref, computed, onMounted } from 'vue'
import { right } from '@js/helpers'
import { useStore } from 'vuex'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'
const { t } = useI18n()
const props = defineProps({
  opened: Boolean,
  climber_id: Number,
  country: String,
  ranking_id: Number,
  first : String,
  last : String,
})

const emit = defineEmits(['close'])
const loading = ref(true)
onMounted(() => {

  loading.value = true
  // Find the top10
  const payload = {
    climber_id: props.climber_id,
    country: props.country,
    ranking_id: props.ranking_id,
  }
  store.dispatch('getRankingTop10', payload).then(() => {
    debugger
    loading.value = false
    })
})
const ranking = computed(() => store.state.rankingtop10)
const store = useStore()
const grades = computed(() => store.state.grades)
const getFirstTickTimestamp = (problem) => {
  return toLocalTime(problem.ascent_tstamp, 'YYYY-MM-DD')
}
const problemSortedByGrade = computed(() => {
  return ranking.value.problems.sort((a, b) => {
    let gradeA = 0
    let gradeB = 0
    if (a != null && a.grade != null) {
      gradeA = a.grade.score
    }
    if (b != null && b.grade != null) {
      gradeB = b.grade.score
    }

    return gradeB - gradeA
  })
})
const climberProfileLink = (row) => {
  return '/climber/' + props.climber_id
}
const getScore = (problems) => {
  return problems.reduce((acc, x) => acc + x.grade.score, 0)
}
const getChange = (problem, withPrefix = false) => {
  const totalTries = problem.total_tries
  if (withPrefix) {
    const change = calculatePoints(problem.routetype, totalTries)
    if (change > 0) {
      return '+ ' + change
    } else {
      return '- ' + Math.abs(change)
    }
  } else {
    return calculatePoints(problem.routetype, totalTries)
  }
}
const getPoints = (problem) => {
  // First, find amount of tries, this is because if you
  // tick one problem more than once, we just count it as one
  // and sum up the tries (= you get less from the ascents)
  return problem.grade.score + getChange(problem)
}
</script>
