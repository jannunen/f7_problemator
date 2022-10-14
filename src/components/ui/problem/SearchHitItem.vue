<template>

  <f7-list-item media link="#" swipeout @swipeout:open="swipingout = true" @swipeout:closed="swipingout = false" @click="() => onClick(problem)">

    <template #title>
      <div>{{ getAfter(problem) }}
      </div>
    </template>

tai jotain 'tojoksikin muuksi' jadslkjasdlk
    <template #after>
      <strong class="text-white font-bold  mr-2 " v-if="problem.c_like > 0">
        {{ problem.c_like }}
        <f7-icon size="16" color="red" md="material:heart_fill" aurora="f7:heart_fill" ios="f7:heart_fill" />
      </strong>
    </template>

    <template #header>
      <small> {{ problem.ascents_count }} {{ t('home.ascents') }}</small>
    </template>

    <template #inner-end>
       <p-badge>{{ t('home.by') }} {{ problem.author?.etunimi }} {{ left(problem.author?.sukunimi,1) }}.</p-badge>
    </template>



    <template #content-start>
      <div v-if="isMyProject(problem.id) && !isMyTick(problem.id)">
        <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-yellow-100 bg-yellow-600 rounded-full">P</span>
      </div>
      <div v-else-if="isMyTick(problem.id)">
        <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-100 bg-green-600 rounded-full">✓</span>
      </div>
      <div v-else>
        <span class="m-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none ">&nbsp;</span>
      </div>
    </template>

    <template #media>

      <div class="flex flex-col justify-center items-center">
        <round-badge :width="20" :bgColor="problem.colour?.code"></round-badge>
        {{ getTagShort(problem.tag) }}
      </div>
      <h4 style="width: 35px" class="font-bold margin-left no-margin text-2xl">
        {{ getGrade(problem.routetype, problem.grade) }}
      </h4>

    </template>
    <f7-swipeout-actions right>
      <f7-swipeout-button close @click="() => quickTick(problem,1)" color="yellow" class="bg-green-900">Quick tick (1 try)</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,2)" color="yellow" class="bg-green-800">+ 2 tries</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,3)" color="yellow" class="bg-green-700">+ 3 tries</f7-swipeout-button>
    </f7-swipeout-actions>
    <f7-swipeout-actions left>
      <f7-swipeout-button close @click="() => quickTick(problem,1,false)" color="orange" >Quick proj. (1 try)</f7-swipeout-button>
    </f7-swipeout-actions>
  </f7-list-item>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { left, debounce, getTagShort } from '@js/helpers'
import RoundBadge from '@components/ui/RoundBadge.vue'
import PBadge from '@components/PBadge.vue'
import dayjs from 'dayjs'
import relativeTime from "dayjs/plugin/relativeTime"
import { toaster, alert } from '@js/helpers/notifications.js'
import { ref,computed } from 'vue'
import store from '@js/store.js'

dayjs.extend(relativeTime)
export default {
  props: {
    problem: Object,
  },
  emits: ['start-navigate'],
  setup(props, context) {
    const { t, tc } = useI18n()
    const swipingout = ref(false)
    const ticks = computed(() => store.state.alltime.ticks)
    const tries = computed(() => store.state.alltime.tries)

    const isMyProject = (pid) => {
      return tries.value.find(x => x.problemid == pid)
    }
    const isMyTick = (pid) => {
      return ticks.value.find(x => x.problemid == pid)
    }
    const onClick = (problem) => {
      if (!swipingout.value) { context.emit('start-navigate', problem) }
    }
    const quickTick = (problem, tries,actualTick=true) => {
      let payload = {
        tries,
        created: new Date(),
        problemid: problem.id,
        grade_opinion: null,
      }
      // If NOT projecting, mark as an actual tick
      if (actualTick) { 
        payload['ticktype'] = 'tick'
    }
      store.dispatch('saveTick', payload)
        .then((resp) => {
          toaster(resp.message)
        })
        .catch((err) => {
          alert(err)
        })
    }

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
        return 'N/A'  
      }
      const grade = gradeObj.name
      if (grade == 'project') {
        return "proj"
      }
      if (routetype == 'boulder') {
        return grade.toUpperCase()
      }
      return grade.toLowerCase()
    }
    return {
      swipingout,
      quickTick,
      onClick,
      left,
      getTryTries,
      getTrySessions,
      getAuthor,
      getTagShort,
      getAfter,
      isMyProject,
      isMyTick,
      PBadge,
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

<style>
</style>
