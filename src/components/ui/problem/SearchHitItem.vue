<template>

  <f7-list-item media link="#" swipeout @swipeout:open="swipingout = true" @swipeout:closed="swipingout = false" @click="() => onClick(problem)">

    <template #title>
      <div class="hit-title">{{ getAfter(problem) }}
      </div>
    </template>

    <template #after>
      <strong class="hit-likes" v-if="problem.c_like > 0">
        {{ problem.c_like }}
        <span class="material-icons" style="font-size: 14px; color: #ef4444; vertical-align: middle;">favorite</span>
      </strong>
    </template>

    <template #header>
      <small class="hit-ascents"> {{ problem.total_ascents }} {{ t('home.ascents') }}</small>
    </template>

    <template #inner-end>
       <div class="hit-author">{{ problem.author?.etunimi }}&nbsp;{{ left(problem.author?.sukunimi,1) }}.</div>
    </template>



    <template #content-start>
      <div class="w-8">
        <div v-if="isMyProject(problem.id) && !isMyTick(problem.id)">
          <span class="hit-badge hit-badge--project">P</span>
        </div>
        <div v-else-if="isMyTick(problem.id)">
          <span class="hit-badge hit-badge--tick">&#10003;</span>
        </div>
        <div v-else>
          <span class="hit-badge">&nbsp;</span>
        </div>
      </div>
    </template>

    <template #media>

      <div class="flex flex-col justify-center items-center">
        <round-badge :width="20" :bgColor="problem.colour?.code"></round-badge>
        <span class="hit-tag">{{ getTagShort(problem.tag) }}</span>
      </div>
      <h4 class="hit-grade">
        {{ getGrade(problem.routetype, problem.grade) }}
      </h4>

    </template>
    <f7-swipeout-actions right>
      <f7-swipeout-button close @click="() => quickTick(problem,1)" class="swipeout-green">Quick send (1 try)</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,2)" class="swipeout-green-mid">+ 2 tries</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,3)" class="swipeout-green-light">+ 3 tries</f7-swipeout-button>
    </f7-swipeout-actions>
    <f7-swipeout-actions left>
      <f7-swipeout-button close @click="() => quickTick(problem,1,false)" class="swipeout-orange">Quick proj. (1 try)</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,2,false)" class="swipeout-orange">Quick proj. (2 tries)</f7-swipeout-button>
      <f7-swipeout-button close @click="() => quickTick(problem,3,false)" class="swipeout-orange">Quick proj. (3 tries)</f7-swipeout-button>
    </f7-swipeout-actions>
  </f7-list-item>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { left, debounce, getTagShort } from '@js/helpers'
import RoundBadge from '@components/ui/RoundBadge.vue'
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

<style scoped>
.hit-title {
  color: var(--p-text-secondary);
  font-size: 0.85rem;
}
.hit-likes {
  color: var(--p-text);
  font-weight: 700;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.hit-ascents {
  color: var(--p-text-muted);
  font-size: 0.75rem;
}
.hit-author {
  font-size: 0.75rem;
  color: var(--p-text-dim);
}
.hit-tag {
  font-size: 0.65rem;
  color: var(--p-text-muted);
}
.hit-grade {
  width: 35px;
  font-weight: 700;
  margin-left: 4px;
  margin-top: 0;
  margin-bottom: 0;
  font-size: 1.25rem;
  color: var(--p-text);
}
.hit-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  margin: 2px;
}
.hit-badge--project {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.hit-badge--tick {
  background: rgba(59, 178, 115, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(59, 178, 115, 0.3);
}
.swipeout-green {
  background: rgba(59, 178, 115, 0.25) !important;
  color: #6ee7b7 !important;
}
.swipeout-green-mid {
  background: rgba(59, 178, 115, 0.18) !important;
  color: #6ee7b7 !important;
}
.swipeout-green-light {
  background: rgba(59, 178, 115, 0.12) !important;
  color: #6ee7b7 !important;
}
.swipeout-orange {
  background: rgba(245, 158, 11, 0.2) !important;
  color: #fcd34d !important;
}
</style>
