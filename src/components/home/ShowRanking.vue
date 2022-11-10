<template>
    <f7-list class="mt-1 mb-3">
    <f7-list-item title="My rank" >
      <template #after-start>
      <div class="text-yellow-400">{{ myRank.points}}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(myRank.points)}}</div>
      </template>
      <template #media>
        <f7-icon icon="demo-list-icon">{{ myRank.rank}}.</f7-icon>
      </template>
        
    </f7-list-item >
    </f7-list>
    <f7-list class="my-2">
    <f7-list-item 
    v-for="row in pagination.data"
    :title="getClimberName(row)" >
      <template #after-start>
      <div class="text-yellow-400">{{ row.points}}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(row.points)}}</div>
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
const props = defineProps({
    'ranking' : Object,
    'country' : String,
})
const { t } = useI18n()
const store = useStore()
const grades = computed(() => store.state.grades)
const estimateGrade = (points) => {
    const singleGrade = points / 10
    const gradeScore = Math.floor(singleGrade/50)*50;

    const gradeObj = grades.value.find(x => x.score == gradeScore)
    if (gradeObj != null) {
        return gradeObj.name
    }
    return "N/A"
}

const getClimberName = (row) => {
    if (row.etunimi == null && row.sukunimi == null) {
        return "Secret Nugget"
    }
    return row.etunimi + ' ' +row.sukunimi
}
const loadRanking = (url) => {
    store.dispatch('rankings',{url, country : props.country})
}
const pagination = computed(() => props.ranking.pagination)
const myRank = computed(() => props.ranking.myrank)
</script>