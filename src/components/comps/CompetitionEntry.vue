<template>
  <div>
    <h1 class="my-2 text-2xl font-bold">{{ comp.name }}</h1>
    <h2 class="text-xl">
        {{ t('comps.problems') }}
        <small>{{ sortedProblems.length }} problem(s)</small>
    </h2>
    <h3 class="">
        {{ t('comps.timespan') }} {{ comp.timespan_start }} - {{ comp.timespan_end }}
    </h3>
    <h4>{{ t('comps.participants') }} : {{ comp.paidregistrations?.length }} </h4>
      <div v-if="sortedProblems.length == 0" class="my-3 text-2xl">
        No problems have been added - yet.
      </div>


    <f7-list v-if="compOngoing">
        <f7-block-title>Swipe left to delete an ascent</f7-block-title>
      
      <f7-list-item class="">
       <template #title>
        <span class="text-3xl font-bold">{{ tickCount }}</span> / <span class="text-xl">{{ sortedProblems.length }}</span> ticked
       </template>
       <template #after>
           <span class="text-white text-lg">{{ timeLeft }}</span>
       </template>
      </f7-list-item>
      
      <f7-list-item 
      swipeout
      v-for="prob in sortedProblems" :key="prob.id"
      >
      <f7-swipeout-actions right>
        <f7-swipeout-button color="red" close @click="() => onDeleted(prob.id)" confirm-text="Are you sure you want to delete this tick?">Delete</f7-swipeout-button>
      </f7-swipeout-actions>
        <template #media>
            <div class="w-16 flex flex-row justify-between">
                <div class="mr-1 font-bold text-3xl">{{ prob.pivot.num }}</div><br />
                <div class="flex flex-col w-8">
                    <div class="h-6 w-6 border border-white rounded-md" :style="getStyles(prob)"> </div>
                    <div class="mr-2 pt-2 text-sm font-bold">{{ prob.tag.substr(-4) }}</div>
                </div>
            </div>
        </template>
        <template #title >
            <div class="flex flex-row justify-between w-full">
                <f7-stepper  
                    fill
                    :value="tries[prob.id]?.tries"
                    @stepper:change="(num) => setTries(prob.id,num)"
                ></f7-stepper>
            </div>
        </template>
        <template #after>

                <f7-button @click="() => doTick(prob.id)" class="mx-2 btn-primary btn-small dark:bg-green-500  bg-green-600">tick</f7-button>
                <span v-if="tries[prob.id]?.ticked" class="w-5 text-red-400 font-bold text-2xl">✓</span>
                <span v-else class="w-5 text-white font-bold text-2xl">&nbsp;</span>
        </template>
      </f7-list-item>
    </f7-list>
    <div v-else>
        {{ t('comps.the_comp_has_not_started_yet') }}
    </div>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { f7ready, f7, useStore } from 'framework7-vue'
import { onMounted, computed, ref } from 'vue'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import dayjs from 'dayjs'
import  duration  from 'dayjs/plugin/duration'
import  isBetween  from 'dayjs/plugin/isBetween'
import { confirm, toaster } from '@helpers/notifications.js'
dayjs.extend(duration)
dayjs.extend(isBetween)
const { t } = useI18n()
const props = defineProps({
  comp: Object,
})
const tries = ref({})
const compOngoing = computed(() => {
    return dayjs().isBetween(dayjs(props.comp.timespan_start),dayjs(props.comp.timespan_end))
})
// First, set the tries from the comp object.
tries.value = Object.keys(props.comp.userticks).reduce((acc,key) => {
    const aTick = props.comp.userticks[key]
    acc[aTick.problemid] = {
        tries : parseInt(aTick.tries),
        tries_bonus : parseInt(aTick.tries_bonus),
        ticked : true,
    }
    return acc
},{})
const onDeleted = (id) => {
   store.dispatch('deleteTickByProblem',{problemid : id})
    .then(ret => {
        // Remove the tick
        tries.value[id] = {...tries.value[id],ticked : false, tries : 0}
        toaster(t(ret.message))
    })
    .catch(err => {
    })

}
const setTries = (id, triesAmount) => {
   if (!(id in tries.value)) {
       tries.value[id] = {tries : 0  }
   }
   const newTries = {...tries.value[id], 'tries' : triesAmount }
   tries.value[id] = newTries 
}
setInterval(() => {
    // Update time left
    const dur = dayjs.duration(dayjs(props.comp.timespan_end).diff(dayjs()))
    timeLeft.value = dur.format('D[day(s)] HH[h] mm[m] ss[s]') + " left"

},1000)
const timeLeft = ref(null)
const doTick = (id) => {
    const amountTries = tries.value[id].tries
    const payload = {
        ticktype : 'tick',
        tries : amountTries,
        created : new Date(),
        problemid : id,
        grade_opinion : null,
    }
    store.dispatch('saveTick',payload)
    .then(ret => {
        tries.value[id] = {...tries.value[id], ticked : true}
        toaster(t('comps.tick_saved'))
    })
    .catch(err => {
    })
}
const getStyles = (prob) => {
    const htmlcolour = prob.colour.code
    const textcolor = prob.colour.textcolor
    return {
        'background-color' : htmlcolour,
        'color' : textcolor,
    }
}
const tickCount = computed(() => {
    return Object.keys(tries.value).reduce( (acc, key) => {
        const tryObj = tries.value[key]
        if (tryObj.ticked) {
         acc = acc+1
        }
        return acc
    },0)
})
const sortedProblems = computed(() => {
  return props.comp.problems.sort((a, b) => {
    const anum = parseInt(a.pivot.num)
    const bnum = parseInt(b.pivot.num)
    if ((anum-bnum) == 0) {
      return a.tag.localeCompare(b.tag)
    } else {
      return anum-bnum
    }
  })
})
</script>
