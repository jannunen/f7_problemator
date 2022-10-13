<template>
  <small>Last update {{ lastUpdate.format("YYYY-MM-DD HH:mm.ss") }}<br /></small>
  Points per route updates automatically ever 30 secs.
  <div class="flex flex-row flex-wrap" v-if="pointsPerRoute != null">
    <div class="w-1/4 p-2" v-for="(cat) in pointsPerRoute" :key="cat.category.id">
      <h2 class="font-bold ">{{ cat.category.nimi }}</h2>
      <ul>
        <li v-for="problem in cat.points" :key="problem.id" class="flex justify-between">
          <span class="font-mono">{{ right(problem?.tag,4) }}</span>
          {{ problem.pivot.num }}
          <div class="font-bold"> {{ problem.points }} </div>
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

</script>