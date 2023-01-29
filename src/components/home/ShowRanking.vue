<template>
    
    

    <f7-list class="mt-1 mb-3">
    <f7-list-item  link="#" @click.prevent="showMyTop10" title="Show my top10" >
      <template #after-start>
      <div class="text-yellow-400">{{ myRank.points}}</div>
      </template>
      <template #after>
       <div class="pl-1 font-bold w-10 text-white">~{{ estimateGrade(myRank.points),grades}}</div>
      </template>
        
    </f7-list-item >
    </f7-list>
    <f7-list class="my-2">
    <f7-list-item 
    v-for="row in pagination.data"
    :title="getClimberName(row)" 
    link="#"
    @click.prevent="openTop10(row)"
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
    <show-climber-top10 v-if="showAscents" :country="props.country" :first="first" :last="last" :climber_id="climber" :ranking_id="props.ranking.ranking.id" :opened="showAscents" @close="showAscents=false"/>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
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
const openTop10 = (row) => {
    climber.value = row.climber_id
    showAscents.value = true
    first.value = row.etunimi
    last.value = row.sukunimi
}
</script>