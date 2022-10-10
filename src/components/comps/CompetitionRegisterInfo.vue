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
        <small class="text-gray-300 my-0">ID: {{ comp.id }}</small>
        <div class="my-2">
          Location: <strong>@{{ comp.location }}</strong>
        </div>
        <div class="my-2">
          Time span: <strong>{{ comp.timespan_start }} - {{ comp.timespan_end }} </strong>
        </div>

        <p v-html="comp.register_form_text"></p>
        <h1 class="my-1 font-bold text-lg">{{ t('comps.categories') }}</h1>
        <p class="text-blue-300">{{ t('comps.fastest_hands_wins') }}</p>
        <div class="my-2">
          <f7-list media-list>
            <f7-list-item v-for="cat in comp.categories" :key="cat.id" :title="cat.nimi">
              <template #subtitle>
                Max. participants
                <span class="text-green-400" v-if="cat.pivot.maxparticipants == null">
                  unlimited
                </span>
                <span v-else>
                  {{ cat.pivot.maxparticipants }}
                </span>
              </template>
              <template #after>
                <div v-if="isCategoryFull(cat)">
                  {{ t('comps.category_full_text') }}
                </div>
                <div v-else>
                  <div v-if="cat.participatesunpaid" class="text-yellow-400 font-bold">
                      {{ t('comps.registered_unpaid') }}
                    <f7-button  
                    class="btn-primary dark:bg-green-500 btn-small " 
                      :link="getPaymentLink(cat)"
                    >{{ t('comps.pay_comp') }}</f7-button>
                  </div>
                  <div v-else-if="cat.participates" class="text-green-400 font-bold">
                      {{ t('comps.registered_paid') }}
                  </div>
                  <div v-else>
                    <button  @click="askRegister(cat)" class="btn-primary btn-small" >{{ t('comps.register_button') }}</button>
                  </div>
                </div>
              </template>
              <template #text>
                <span
                  v-if="!isNaN(parseFloat(cat.pivot.price))"
                  class="font-bold text-indigo-400"
                >
                  {{ t('comps.prices') }}
                  {{ cat.pivot.price }}€
                </span>
                <span class="text-white font-bold" v-else>{{ t('comps.no_entry_fee') }}</span>
                <span v-if="!isNaN(parseFloat(cat.pivot.memberprice))">
                  {{ t('comps.special_price') }}
                  <span class="font-bold text-indigo-300"
                    >{{ cat.pivot.memberprice }}€</span
                  >
                </span>
                <br />
                <span class="text-green-600 text-sm ">
                  {{ t('comps.paidregistrations') }}
                  {{ cat.participants.length }}
                </span>
                <span class="px-1 text-white">|</span>
                <span class="text-orange-600 text-sm mx-1 ">
                  {{ t('comps.unpaidregistrations') }}  
                  {{ cat.unpaidparticipants || 0 }}
                </span>
              </template>
            </f7-list-item>
          </f7-list>
        </div>
        <p class="likes mt-2">
          {{ t('comps.paid_contenders_in_total') }}: {{ comp.paidregistrations?.length  || 0}}
        </p>
      </f7-card-content>
      <f7-card-footer class="no-border">
      </f7-card-footer>
    </f7-card>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import CompetitionRegisterInfo from '@components/comps/CompetitionRegisterInfo.vue'
import { confirm, toaster } from '@helpers/notifications.js'
const store = useStore()

const { t } = useI18n()
const props = defineProps({
  comp: Object,
})
const isCategoryFull = (cat) => cat.maxparticipants - cat.participants.length <= 0
const user = computed(() => store.state.user)
const getPaymentLink = (cat) => {
    return `https://www.problemator.fi/t/problemator/competitions/payment/${cat.compid}?contid=${user.id}`
}

const askRegister = (cat) => {
    confirm(t('comps.are_you_sure_you_want_to_register'),null,() => {
        // send registration
        const payload = {
            compid : props.comp.id,
            category : cat.id,
        }
        store.dispatch('registerToComp',payload)
        .then(ret => {
            toaster(ret.message)
        })
    },() => {
        // cancle
    })
}

const getContenderCount = (cat) => {
  if (cat.paidregistrations == null) {
    return 0
  }
  return cat.paidregistrations.length
}
</script>
