<template>
  <div>

  <f7-list>
      <f7-list-item @swipeout:deleted="(evt) => onDeleted(tick,j)" swipeout v-for="(tick , index) in reversedTicks" :key="tick.id" >
        <template #media>
          {{ (index +1) }}.
        </template>
        <template #title>
          <div class="flex flex-col">
            <div v-if="tick.tries == 1" class="rounded-full font-bold text-yellow-400 text-sm ">flash</div>
            <div v-else class="rounded-full font-bold text-sm text-red-400 ">redpoint</div>
            <div class="">{{ t('problem.tries',parseInt(tick.tries)) }} </div>
          </div>
        </template>
        <template #after>
          <div class="flex flex-col">
            <div class="text-sm">{{ dayjs(tick.tstamp).fromNow() }}</div>
            <div class="text-sm">{{ dayjs(tick.tstamp).format("DD.MM.YYYY HH:mm") }}</div>
          </div>
        </template>
        <f7-swipeout-actions right>
          <f7-swipeout-button delete :confirm-text="$t('problem.tick_delete_are_you_sure')">{{ $t('delete') }}</f7-swipeout-button>
        </f7-swipeout-actions>
      </f7-list-item>
  </f7-list>

  </div> 
</template>

<script>
import RoundBadge from "../RoundBadge.vue"
import { getTagShort} from '@js/helpers.js'
import dayjs from 'dayjs'
import { toaster } from '@js/helpers.js'
import { useI18n } from "vue-i18n";
import { computed} from 'vue'
import { useStore } from 'vuex'

export default {
  props : {
    problem : {
      type : Object,
      default : null,
    },
    ticks : {
      type : Array,
      default : [],
    }
  },
  setup (props) {
    const { t, d, locale } = useI18n();
    const store = useStore()
    const onDeleted = (tick) => {
      store.dispatch('deleteTick',tick.id)
      .then((resp) => {
        toaster(resp.message)
      })
    }
    const getTriesText = (tick) => t('problem.tries',{n : tick.tries}) 
    const reversedTicks = computed(() => props.ticks.reverse())
   
    return {
      dayjs,
      onDeleted,
      getTagShort,
      getTriesText,
      reversedTicks,
      t,
    }

  },
  components: { 
    RoundBadge 
    }, 

}
</script>

<style>

</style>