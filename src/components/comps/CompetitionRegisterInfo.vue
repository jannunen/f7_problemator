<template>
  <div>
    <f7-card class="demo-facebook-card">
      <f7-card-header class="no-border">
        <div class="demo-facebook-avatar">
          <i class="icon material-icons md-only">emoji_events</i>
        </div>
        <div class="demo-facebook-name">{{ comp.name }}</div>
        <div class="demo-facebook-date">{{ comp.compdate }}</div>
      </f7-card-header>
      <f7-card-content>
          <div class="my-2 ">Location: <strong>@{{ comp.location }}</strong></div>
          <div class="my-2 ">Time span: <strong>{{ comp.timespan_start }} - {{ comp.timespan_end }} </strong></div>

        <p v-html="comp.register_form_text"></p>
        <h1 class="my-1 font-bold text-lg">{{ t('comps.categories') }}</h1>
        <p class="text-blue-300">{{ t('comps.fastest_hands_wins') }}</p>
        <div class="my-2">
        <f7-list media-list>
            <f7-list-item v-for="cat in comp.categories" :key="cat.id"
            :title="cat.nimi" 
            > 
            <template #subtitle>
                Max. participants
                <span class="text-green-400" v-if="cat.pivot.maxparticipants==null">
                      unlimited
                </span>
                <span v-else>
                    {{ cat.pivot.maxparticipants }}
                </span>
            </template>
            <template #after>
               <span class="text-green-600 text-sm p-1">
               {{ t('comps.paidregistrations') }}
               {{ cat.participants.length }} 
               </span>
               <span class="text-orange-600 text-sm mx-1 p-1">
               {{ t('comps.unpaidregistrations') }}
               {{ cat.unpaidparticipants || 0}} 
               </span>
            </template>
            <template #text>
                {{ t('comps.prices') }}
                    <span v-if="!isNaN(parseFloat(cat.pivot.price))" class="font-bold text-indigo-400">
                    {{ cat.pivot.price }}€
                    </span>
                    <span v-if="!isNaN(parseFloat(cat.pivot.memberprice))" >
                        {{ t('comps.special_price') }}
                    <span class="font-bold text-indigo-300">{{ cat.pivot.memberprice }}€</span>
                    </span>
            </template>
            </f7-list-item>
        </f7-list>
        </div>
        <p class="likes mt-2">{{ t('comps.contenders_in_total') }}: {{ comp.paidregistrations.length }} </p>
      </f7-card-content>
      <f7-card-footer class="no-border">
        <!--<f7-button class="btn-primary">Share</f7-button>-->
        <f7-button class="btn-primary">Register</f7-button>
      </f7-card-footer>
    </f7-card>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import store from '@js/store.js'
import { f7ready, f7, useStore } from 'framework7-vue'
import { onMounted, computed, ref } from 'vue'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import dayjs from 'dayjs'
const { t } = useI18n()
const props = defineProps({
  comp: Object,
})
const getContenderCount = (cat) => {
 if (cat.paidregistrations == null) {
     return 0
 } 
 return cat.paidregistrations.length
}
</script>
