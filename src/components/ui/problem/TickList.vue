<template>
  <f7-popup :opened="opened">
    <f7-page>
      <f7-navbar :title="t('problem.my_ticks')">
        <f7-nav-right>
          <f7-link @click.prevent="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <div class="text-center" v-html="t('problem.myticks_intro')"></div>
        <div v-if="reversedTicks.length > 0 || reversedProjects.length > 0">
         <f7-block-title>Ticks</f7-block-title>
        <f7-list v-if="reversedTicks.length > 0"> 
          <f7-list-item
            @swipeout:deleted="(evt) => onDeleted(tick, j)"
            swipeout
            v-for="(tick, index) in reversedTicks"
            :key="tick.id"
          >
            <template #media> {{ index + 1 }}. </template>
            <template #title>
              <div class="flex flex-col">
                <div
                  v-if="tick.tries == 1"
                  class="rounded-full font-bold text-yellow-400"
                >
                  {{ t('flash') }}
                </div>
                <div v-else class="rounded-full font-bold  text-red-400">
                  {{ t('redpoint') }}
                </div>
                <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
              </div>
            </template>
            <template #after>
              <div class="flex flex-col">
                <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                <div class="text-sm">
                  {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                </div>
              </div>
            </template>
            <f7-swipeout-actions right>
              <f7-swipeout-button
                delete
                :confirm-text="t('problem.tick_delete_are_you_sure')"
                >{{ t('delete') }}</f7-swipeout-button
              >
            </f7-swipeout-actions>
          </f7-list-item>
        </f7-list>
         <f7-block-title>Tries / Projecting</f7-block-title>
        <f7-list v-if="reversedProjects.length > 0"> 
          <f7-list-item
            @swipeout:deleted="(evt) => onProjectDeleted(tick, j)"
            swipeout
            v-for="(tick, index) in reversedProjects"
            :key="tick.id"
          >
            <template #media> {{ index + 1 }}. </template>
            <template #title>
              <div class="flex flex-col">
                <div
                  class="rounded-full font-bold text-yellow-400"
                >
                  {{ t('a burn') }}
                </div>
                <div class="text-sm">{{ t('problem.tick_in_tries', parseInt(tick.tries)) }}</div>
              </div>
            </template>
            <template #after>
              <div class="flex flex-col">
                <div class="text-sm">{{ dayjs.utc(tick.tstamp).fromNow() }}</div>
                <div class="text-sm">
                  {{ dayjs.utc(tick.tstamp).local().format('DD.MM.YYYY HH:mm') }}
                </div>
              </div>
            </template>
            <f7-swipeout-actions right>
              <f7-swipeout-button
                delete
                :confirm-text="t('problem.tick_delete_are_you_sure')"
                >{{ t('delete') }}</f7-swipeout-button
              >
            </f7-swipeout-actions>
          </f7-list-item>
        </f7-list>
        </div>
        <div v-else class="my-2 text-center font-bold text-orange">
          {{ t('problem.you_have_no_ticks') }}
        </div>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import RoundBadge from '../RoundBadge.vue'
import { getTagShort } from '@js/helpers'
import dayjs from 'dayjs'
import { ref} from 'vue'
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc)
dayjs.extend(timezone)
const guessed = ref(dayjs.tz.guess())
dayjs.tz.setDefault(guessed.value)
console.log(guessed.value)

import store from '@js/store.js'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useStore } from 'framework7-vue'

const props = defineProps({
  problem: {
    type: Object,
    default: null,
  },
  projects: {
    type: Array,
    default: [],
  },
  ticks: {
    type: Array,
    default: [],
  },
  opened : {
    type : Boolean,
  }
})

const { t } = useI18n()
const onProjectDeleted = (tick) => {
  store.dispatch('deleteProject', tick.id).then((resp) => {
    toaster(resp.message)
  })
}
const onDeleted = (tick) => {
  store.dispatch('deleteTick', tick.id).then((resp) => {
    toaster(resp.message)
  })
}
const emit = defineEmits(['close'])
const getTriesText = (tick) => t('problem.tries', { n: tick.tries })
const reversedTicks = computed(() => props.ticks?.reverse())
const reversedProjects = computed(() => props.projects?.reverse())

</script>

<style></style>
