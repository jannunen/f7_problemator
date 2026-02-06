<template>
    <f7-popup v-model:opened="showAscents">
    <f7-page>
      <f7-navbar title="Top10 ascents for ranking">
        <f7-nav-right>
          <f7-link @click="closeTop10Popup" popup-close>Close</f7-link>
        </f7-nav-right>
      </f7-navbar>

      <f7-block v-if="loading" class="text-center">
        <f7-block-title><i class="fa fa-spinner fa-spin"></i> Loading...</f7-block-title>
      </f7-block>
      <f7-block class="m-0" v-if="climber != null && !loading">
        <h2 class="text-2xl uppercase my-2 text-center font-bold">{{  first }} {{ last }}</h2>
        <div class="my-1 text-center bg-blue-500 font-bold uppercase w-full">
          <a class="w-full block py-2 px-4 " @click="closeTop10Popup" :href="climberProfileLink(climber)">Open profile</a>
        </div>

        <div class="m-0" v-if="rankingtop10 != null && rankingtop10.id != null">
          <f7-block-title class="px-2"
            >Rank consists of {{ rankingtop10.problems.length }} problem(s)</f7-block-title
          >
          <f7-list problem-list>
            <f7-list-item
              @swipeout:deleted="(evt) => onDeleted(problem, j)"
              v-for="(problem, index) in rankingtop10.problems"
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
                  {{ rankingtop10.points }}
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
                  {{ estimateGrade(getScore(rankingtop10.problems), grades) }}
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
                  {{ estimateGrade(rankingtop10.points, grades) }}
                </div>
              </template>
            </f7-list-item>
          </f7-list>
        </div>
        <div v-else>No ascents</div>
      </f7-block>
    </f7-page>
  </f7-popup>
<div>
    
    <f7-list class="my-2">
    <f7-list-item 
    v-for="row in pagination.data"
    :title="getClimberName(row)" 
    @click.prevent="openTop10(row)"
    >
      <template #after-start>
      <div class="text-yellow-400">{{ row.points }}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(row.points, grades) }}</div>
      </template>
      <template #media>
        <f7-icon icon="demo-list-icon">
          <div class="flex flex-col items-center">
            <span>{{ row.rank }}.</span>
            <span v-if="country && country !== 'global' && row.global_rank" class="text-xs text-gray-400">#{{ row.global_rank }}</span>
          </div>
        </f7-icon>
      </template>
    </f7-list-item>
    
    
  </f7-list>


    <hr class="mt-1" />
    <div class="flex flex-row justify-between">
       <a class="text-blue-500" href="#" @click.prevent="loadRanking(pagination.first_page_ur)">first</a>
       <a class="text-blue-500" h href="#" @click.prevent="loadRanking(pagination.prev_page_url)">prev</a>
       {{ pagination.current_page }} / {{ pagination.last_page }}
       <a class="text-blue-500" h href="#" @click.prevent="loadRanking(pagination.next_page_url)">next</a>
       <a class="text-blue-500" h href="#" @click.prevent="loadRanking(pagination.last_page_url)">last</a>
    </div> 
    </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { right } from '@js/helpers'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'
import ShowClimberTop10 from '../ranking/ShowClimberTop10.vue'


const props = defineProps({
    'ranking': Object,
    'country': String,
})

const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const showAscents = ref(false)
const user = computed(() => store.state.climber)
const showMyTop10 = () => {
    climber.value = user.value.id
    showAscents.value = true
}
const getLink = (row) => {
    return "/ranking/top10"
}
const closeTop10Popup = () => {
    showAscents.value = false
    climber.value = null
    first.value = null
    last.value = null
    loading.value = true
}
const getClimberName = (row) => {
    if (row.etunimi == null && row.sukunimi == null) {
        return "Secret Nugget"
    }
    return row.etunimi + ' ' + row.sukunimi
}
const loadRanking = (url) => {
    store.dispatch('rankings', { url, country: props.country })
}
const pagination = computed(() => props.ranking.pagination)
const climber = ref(null)
const first = ref(null)
const last = ref(null)
const myRank = computed(() => props.ranking.myrank)
const loading = ref(true)
const openTop10 = (row) => {
    climber.value = row.climber_id
    showAscents.value = true
    first.value = row.etunimi
    last.value = row.sukunimi
    loading.value = true
    // Find the top10
    const payload = {
        climber_id: climber.value,
        country: props.country,
        ranking_id: props.ranking.ranking.id,
    }
    store.dispatch('getRankingTop10', payload).then(() => {
        loading.value = false
    })
}

const rankingtop10 = computed(() => store.state.rankingtop10)
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
const climberProfileLink = (id) => {
  return '/climber/' + id
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