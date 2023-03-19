<template>
  <small>Last update {{ lastUpdate.format("YYYY-MM-DD HH:mm.ss") }}<br /></small>
  Points per route updates automatically ever 30 secs.
  <div class="flex flex-row flex-wrap" v-if="pointsPerRoute != null">
    <div class="w-1/3 p-2" v-for="(cat) in pointsPerRoute" :key="cat.category.id">
      <h2 class="font-bold ">{{ cat.category.nimi }}</h2>
      <ul>
        <li v-for="problem in cat.points" :key="problem.id" class="flex justify-between">
          <span class="font-bold font-mono flex-1">{{ problem?.tag?.substr(7) }}</span>
          <div class="font-bold ml-1 text-yellow-400 flex-1">{{ problem.pivot.num }}</div>
          <div class="font-bold text-right text-green-500 flex-1 "> {{ problem.points }} </div>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup>
import dayjs from 'dayjs'
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import { right } from '@js/helpers'
dayjs.extend(utc)
dayjs.extend(timezone)

const props = defineProps({
  lastUpdate : Object,
  pointsPerRoute: Object,
})
const sortByNum = (points) => {
    if (points == null) {
      return []
    }
    
    Object.keys(points).map(x => points[x]).sort((b,a)   => {
    return a.num?.localeCompare(b.num)
  })
}

</script>