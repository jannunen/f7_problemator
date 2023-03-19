<template>
    <f7-list-item :key="item.id" media link="#">
      <template #header>
        <div class="text-sm">{{ getAfter(item) }}</div>
      </template>
  
      <template #after>
        <strong class="text-white font-bold mr-2" v-if="item.problem.c_like > 0">
          {{ item.problem.c_like }}
          <i class="text-red-500 fa fa-heart " />
        </strong>
      </template>
  
      <template #title>
        <p>{{ item.climber.etunimi }} {{ item.climber.sukunimi }}</p>
      </template>
  
      <template #inner-end>
        <div class="text-sm">
              {{item.problem.gym?.name}} 
        </div>
      </template>
  
      <template #content-start>
        <div class="w-8">
          <div v-if="isMyProject(item.problem.id) && !isMyTick(item.problem.id)">
            <span class="m-1 inline-flex items-center justify-center px-1 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-600 rounded-full">P</span>
          </div>
          <div v-else-if="isMyTick(item.problem.id)">
            <span class="m-1 inline-flex items-center justify-center px-1 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full">✓</span>
          </div>
          <div v-else>
            <span class="m-1 inline-flex items-center justify-center px-1 py-1 text-xs font-bold leading-none">&nbsp;</span>
          </div>
        </div>
      </template>
  
      <template #media>
        <div class="flex flex-col justify-center items-center">
          <round-badge :width="20" :bgColor="item.problem.colour?.code"></round-badge>
          {{ getTagShort(item.problem.tag) }}
        </div>
        <h4 style="width: 35px" class="font-bold margin-left no-margin text-2xl">
          {{ getGrade(item.problem.routetype, item.problem.grade) }}
        </h4>
      </template>
    </f7-list-item></template>
  <script setup>
  import RoundBadge from '@components/ui/RoundBadge.vue'
  import PBadge from '@components/PBadge.vue'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { ref, computed, watch, onMounted } from 'vue'
  import { left, getGrade, getTagShort } from '@js/helpers'
  import { useI18n } from 'vue-i18n'
  import { useStore } from 'vuex'
  const { t } = useI18n()
  const props = defineProps({
    item: Object,
  })
  const store = useStore()
  const ticks = computed(() => store.state.alltime.ticks)
  const tries = computed(() => store.state.alltime.tries)
  const isMyProject = (pid) => {
    return tries.value.find((x) => x.problemid == pid)
  }
  const isMyTick = (pid) => {
    return ticks.value.find((x) => x.problemid == pid)
  }
  const getAuthor = (group) => {
    return group.ascentCount + ' ' + t('home.ascents')
  }
  const getAfter = (group) => {
    const date = dayjs(group.tstamp)
    return "@" + date.format("YYYY-mm-DD HH:MM") 
  }
  </script>
  