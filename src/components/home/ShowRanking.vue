<template>
    <f7-popup v-model:opened="showAscents">
        <f7-page>
            <f7-navbar title="Popup Title">
                <f7-nav-right>
                    <f7-link popup-close>Close</f7-link>
                </f7-nav-right>
            </f7-navbar>
            <f7-block class="m-0 " v-if="myRank.problems">
            <f7-block-title class="px-2">Your rank consists of {{ myRank.problems.length }} problem(s)</f7-block-title>
                <f7-list  problem-list>
                        <f7-list-item @swipeout:deleted="(evt) => onDeleted(problem, j)" v-for="(problem, index) in problemSortedByGrade" :key="problem.id">
                            <template #media>
                                <div class="flex flex-col items-center">{{ index + 1 }}.<br /><span class="font-bold">{{ right(problem.tag, 4) }}</span> </div>
                            </template>
                            <template #title>
                                <div class="flex flex-row">
                                    <span class="px-1 pt-1 text-2xl font-bold w-16">{{ problem.grade.name }}</span>
                                    <div class="flex flex-col">
                                        <div class="flex">
                                            <div class="ps-2"><span class="text-green-500">{{getFirstTickTimestamp(problem)}}</span> @{{ problem.gym.name }} </div>
                                        </div>
                                        <div class="flex flex-row">
                                            {{ problem.routetype}}
                                            <span>
                                            , base score: {{ problem.grade.score}}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template #after>
                                <div class="flex flex-col">
                                    <div class="text-right font-bold ">{{ getTotalTries(problem) }} 
                                     <span v-if="getTotalTries(problem)==1">{{ t('ranking.try')}}</span>
                                     <span v-else>{{ t('ranking.tries') }}</span>
                                     </div>

                                    <div class="font-bold text-right text-yellow-400">
                                    {{ problem.grade.score }}
                                    {{ getChange(problem,true) }}
                                    = {{ getPoints(problem) }}</div>
                                </div>
                            </template>
                        </f7-list-item>
                        <f7-list-item>
                        <template #after>
                            <div class="text-yellow-400 font-bold text-lg">
                            {{ myRank.points }}
                            </div>
                        </template>
                        </f7-list-item>
                        <f7-list-item>
                        <template #title>
                            <div class="flex flex-col">
                                <div>
                                Average grade based on grades 
                                </div>
                            </div>
                        </template>
                        <template #after>
                            <div class="text-yellow-400 font-bold text-lg">
                                {{estimateGrade(getScore(myRank.problems),grades) }}
                            </div>
                        </template>
                        </f7-list-item><f7-list-item>
                        <template #title>
                            <div class="flex flex-col">
                                <div>
                                Average grade based on ascent scores
                                </div>
                            </div>
                        </template>
                        <template #after>
                            <div class="text-yellow-400 font-bold text-lg">
                                {{estimateGrade(myRank.points,grades) }}
                            </div>
                        </template>
                        </f7-list-item>
                    </f7-list>
            </f7-block>
        </f7-page>
    </f7-popup>

    <f7-list class="mt-1 mb-3">
    <f7-list-item  link="#" @click.prevent="showAscents=true" title="My rank (click for details)" >
      <template #after-start>
      <div class="text-yellow-400">{{ myRank.points}}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(myRank.points),grades}}</div>
      </template>
      <template #media>
        <f7-icon icon="demo-list-icon">{{ myRank.rank}}.</f7-icon>
      </template>
        
    </f7-list-item >
    </f7-list>
    <f7-list class="my-2">
    <f7-list-item 
    v-for="row in pagination.data"
    :title="getClimberName(row)" 
    :link="climberProfileLink(row)"
    >
      <template #after-start>
      <div class="text-yellow-400">{{ row.points}}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(row.points,grades)}}</div>
      </template>
      <template #media>
        <f7-icon icon="demo-list-icon">{{ row.rank}}.</f7-icon>
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
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { right } from '@js/helpers'
import { estimateGrade, toLocalTime, calculatePoints } from '@/js/helpers'


const props = defineProps({
    'ranking': Object,
    'country': String,
})
const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const getFirstTickTimestamp=(problem) => {
    const ascents = problem.ascents
    const firstTick = ascents.shift()
    if (firstTick != null) {
        return toLocalTime(firstTick.tstamp,'YYYY-MM-DD')
    }
    return "N/A"
}
const getScore = (problems) => {
    return problems.reduce((acc, x) => acc + x.grade.score, 0)
}
const getTotalTries = (problem) => {
    return problem.ascents.reduce((acc, tick) => {
        const sumTries = parseInt(tick.tries)
        if (!isNaN(sumTries)) {
            acc += sumTries
        }
        return acc
    }, 0)
}
const problemSortedByGrade = computed(() => {
    return myRank.value.problems.sort((a, b) => b.grade.score - a.grade.score)
})
const getChange = (problem,withPrefix = false) => {
    const totalTries = getTotalTries(problem)
    if (withPrefix) {
        const change =  calculatePoints(problem.routetype, totalTries)
        if (change > 0) {
            return "+ " + change
        } else {
            return "- " + Math.abs(change)
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

const showAscents = ref(false)
const climberProfileLink=(row) => {
    if (row.publicascents==1) {
        return "/climber/" + row.climber_id
    } else {
        return "#"
    }
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
const myRank = computed(() => props.ranking.myrank)
</script>