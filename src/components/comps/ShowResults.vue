<template>
  {{ type }}
  <!-- If competition is variable points, this works.. -->
  <div v-if="type == 'variable_points' && results != null">
    <small>Last update {{ lastUpdate.format("YYYY-MM-DD HH:mm.ss") }}<br /></small>
    Results update automatically every 60secs
    <div  class="w-full" v-for="serie in results" :key="serie.category.id">
      <div class="font-bold my-1">{{ serie.category.nimi }}</div>
      <table width="100%" class="text-gray-500 dark:text-gray-400">
        <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 px-1" v-for="result in serie.results " :key="serie.category.id+'_'+result.id">
          <td class="w-1/12">{{result.standing}}</td>
          <td class="w-4/12">{{ result.climber.etunimi }} {{ result.climber.sukunimi }}</td>
          <td class="w-3/12">{{ result.climber.team }} </td>
          <td class="w-2/12">{{ result.climber.height }} </td>
          <td class="w-2/12">{{ result.climber.apeindex }} </td>
          <td class="w-1/12">{{ result.points}} </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- This is for sport comps -->
  <div v-if="type == 'sport'">
    <f7-toolbar tabbar bottom>
      <f7-link tab-link="#tab-1">Qualification</f7-link>
      <f7-link tab-link="#tab-2">Semifinal</f7-link>
      <f7-link tab-link="#tab-3">Finals</f7-link>
    </f7-toolbar>
    <f7-tabs>
      <f7-tab id="tab-1"  tab-active>
        
        Qualification
          <div v-if="results.qualification != null">
            <div class="w-full" v-for="serie in results.qualification.total" :key="serie.category.id">
              <div class="font-bold my-1">{{ serie.category.nimi }}</div>
              <table width="100%" class="text-gray-500 dark:text-gray-400 ">
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 px-2" v-for="result in sortResults(serie.results) " :key="serie.category.id+'_'+result.id">
                  <td class="w-1/12">{{result.standing}}</td>
                  <td class="w-4/12">{{ result.climber.etunimi }} {{ result.climber.sukunimi }}</td>
                  <td class="w-3/12">{{ result.climber.team }} </td>

                  <td class="w-1/12" v-for="route in result.routes" :key="result.climber.id+'_'+route.id">
                  <span class="font-bold" v-if="route.sport_points==1000">TOP</span>
                  <span v-else>{{route.sport_points}}</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          <div v-else>
            No qualification results
          </div>
        
      </f7-tab>
      <f7-tab id="tab-2" >
        Semifinals
          <div v-if="results.semifinal != null">
            <div class="w-full" v-for="serie in results.semifinal" :key="serie.category.id">
              <div class="font-bold my-1">{{ serie.category.nimi }}</div>
              <table width="100%" class="text-gray-500 dark:text-gray-400 ">
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 px-2" v-for="result in sortResults(serie.results) " :key="serie.category.id+'_'+result.id">
                  <td class="w-1/12">{{result.standing}}</td>
                  <td class="w-4/12">{{ result.climber.etunimi }} {{ result.climber.sukunimi }}</td>
                  <td class="w-3/12">{{ result.climber.team }} </td>
                  <td class="w-1/12">
                  <span class="font-bold" v-if="result.sport_points==1000">TOP</span>
                  <span v-else>{{result.sport_points}}</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          <div v-else>
            No semifinal results
          </div>
        
      
        
      </f7-tab>
      <f7-tab id="tab-3" >
        Finals
        <p>Climbers with 0 result are not shown in the list</p>
          <div v-if="results.final != null">
            <div class="w-full" v-for="serie in results.final" :key="serie.category.id">
              <div class="font-bold my-1">{{ serie.category.nimi }}</div>
              <table width="100%" class="text-gray-500 dark:text-gray-400 ">
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 px-2" 
                v-for="(result,idx) in sortResults(serie.results) " 
                :key="serie.category.id+'_'+result.id">
                  <td class="w-1/12">{{result.standing}}</td>
                  <td class="w-4/12">{{ result.climber.etunimi }} {{ result.climber.sukunimi }}</td>
                  <td class="w-3/12">{{ result.climber.team }} </td>
                  <td class="w-1/12">
                  <span class="font-bold" v-if="result.sport_points==1000">TOP</span>
                  <span v-else>{{result.sport_points}}</span>
                  </td>
                </tr>
              </table>
            </div>
          </div>
          <div v-else>
            No final results
          </div>
        
      </f7-tab>
    </f7-tabs>
  </div>

</template>
<script setup>
import dayjs  from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps({
  lastUpdate: Object,
  type: String, 
  results: Object, 
})
const sortResults = (keyedResults) =>  Object.keys(keyedResults).map(key => keyedResults[key]).sort((a,b) => { return a.standing - b.standing })


</script>