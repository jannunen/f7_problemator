<template>
  <div>
    <f7-card class="">
      <f7-card-header class="no-border">
        <div class="">{{ comp.name }}</div>
        <div class="">{{ toLocalTime(comp.compdate) }}</div>
      </f7-card-header>
      <f7-card-content v-if="comp != null">

        <f7-link :href="getResultsLink" class="link external pt-2 btn-primary font-bold ">Open results page</f7-link>
        <small class="text-gray-300 my-0">ID: {{ comp.id }}</small>
        <div class="my-2">
          {{ t('comps.location') }}: <strong>@{{ comp.location }}</strong>
        </div>
        <div class="my-2">
          {{ t('comps.tick_time_span') }}: <strong>{{ toLocalTime(comp.timespan_start) }} - {{ toLocalTime(comp.timespan_end) }} </strong>
        </div>

        <p v-html="comp.register_form_text"></p>
        <h1 class="my-1 font-bold text-lg">{{ t('comps.categories') }}</h1>
        <p class="text-blue-300">{{ t('comps.fastest_hands_wins') }}</p>
        <div v-if="comp.categories.length > 0">
        <div class="my-2">

          <ul>
            <li v-for="cat in comp.categories" :key="cat.id" class="bg-gray-900 my-2 rounded-md p-2 border border-blue-800">
                 <div class=" text-xl font-bold my-1 text-white">{{  cat.nimi }}</div>
                <div v-if="isCategoryFull(cat)">
                  {{ t('comps.category_full_text') }}
                </div>
                <div v-else>
                  <div v-if="isRegistered(cat.id)" class="text-green-400 font-bold">
                      {{ t('comps.registered') }}
                    <div v-if="isPaid(cat.id)" class="text-green-400 font-bold">
                      {{ t('comps.paid')}}
                    </div>
                    <div v-else class="text-yellow-400 font-bold">
                        {{ t('comps.registered_unpaid') }}
                      <!--<f7-button  color="green" :link="getPaymentLink(cat)" >{{ t('comps.pay_comp') }}</f7-button>
                      -->
                      </div>
                    <p-button  @click="askUnRegister(cat)" class="my-2 bg-red-500" >{{ t('comps.quit_comp') }}</p-button>

                  </div>
                  <div v-else>

                    <div v-if="isRegistrationPossible(comp, nowUTC)" >
                      {{ t('comps.registration_ends') }} {{ toLocalTime(comp.registration_end) }}
                      <button  @click="askRegister(cat)" :disabled="isRegistering" class="btn-primary btn-small" >{{ t('comps.register_button') }}</button>
                      <div class="font-bold text-center my-1 text-orange-600" v-if="isRegistering"> Please wait, registering...</div>
                    </div>
                    <div v-else>{{ t('comps.registration_has_closed') }}</div>
                  </div>
                </div>
                
                <div class="flex flex-row justify-between">
                  <div>Max. participants</div>
                  <div class="text-green-400" v-if="cat.pivot.maxparticipants == null">
                    unlimited
                  </div>
                  <div v-else>
                    {{ cat.pivot.maxparticipants }}
                  </div>
                </div>
              
              

                <div class="flex flex-row justify-between">
                    <div> {{ t('comps.prices') }} </div>
                  <div>
                    <span v-if="!isNaN(parseFloat(cat.pivot.price))" >
                      {{ cat.pivot.price }}€
                    </span>
                    <span class="text-white font-bold" v-else>{{ t('comps.no_entry_fee') }}</span>
                  </div>
                </div>

                <div class="flex flex-row justify-between">
                  <div>{{ t('comps.special_price') }}</div>
                  <div>{{ t('comps.if_you_want_to_activate_the_special_price_contact_the_competition_organizer') }}</div>

                  <div v-if="!isNaN(parseFloat(cat.pivot.memberprice))">
                    <span class="font-bold text-indigo-300"
                      >{{ cat.pivot.memberprice }}€</span
                    >
                  </div>
                </div>

   
                <div class="flex flex-row justify-between">
                  <div>Participants</div>
                  <div class="flex flex-start">
                    <div class="text-green-600 text-sm ">
                      {{ t('comps.paidregistrations') }}
                      {{ cat.participants?.length || 0 }}
                    </div>
                    <div class="px-1 text-white">|</div>
                    <div class="text-orange-600 text-sm mx-1 ">
                      {{ t('comps.unpaidregistrations') }}  
                      {{ cat.unpaidparticipants || 0 }}
                    </div>
                  </div>
                </div>
              
            </li>
          </ul>
        </div>
        </div>
        <div v-else class="my-1 p-4 border rounded-lg bg-orange-300 text-black ">
          {{ t('comps.no_categories_with_help') }}        </div>
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
import PButton from '@components/PButton.vue'
import { ref, computed} from 'vue'
import { confirm, toaster } from '@helpers/notifications.js'
import { handleValidationErrors } from '@helpers'
import { isRegistrationPossible, toLocalTime } from '@helpers/component.helpers'

const nowUTC = ref(dayjs().utc())
setInterval(() => nowUTC.value = dayjs().utc(),1000*30)
import dayjs from 'dayjs'
const store = useStore()
const getResultsLink = computed(() => {
    return  `https://api3.problemator.fi/comps/${props.comp.id}/results`

  })

const isRegistering = ref(false)
const { t } = useI18n()
const props = defineProps({
  comp: Object,
})
const climber = computed(() => store.state.climber)

const isRegistered = (catid) => {
  if (climber.value == null) {
    return false
  }
  return (props.comp.paidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) != null  ) ||
  (props.comp.unpaidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) != null  ) 
}
const isPaid = (catid) => {
  if (climber.value == null) {
    return false
  }
  const row = props.comp.paidregistrations.find(x => x.id == climber.value.id && x.pivot.serieid == catid ) 
  return row != null && row.pivot.paid != null && dayjs(row.pivot.paid).year() != 0
}
const isCategoryFull = (cat) => cat.maxparticipants - cat.participants.length <= 0
const user = computed(() => store.state.user)
const getPaymentLink = (cat) => {
    return `https://www.problemator.fi/t/problemator/competitions/payment/${cat.compid}?contid=${user.id}`
}
const askUnRegister = (cat) => {
    confirm(t('comps.are_you_sure_you_want_to_unregister'),null,() => {
        // send registration
        const payload = {
            compid : props.comp.id,
            category : cat.id,
            contenderid : climber.value.id
        }
        store.dispatch('unRegisterToComp',payload)
        .then(ret => {
            toaster(ret.message)
        })
    },() => {
        // cancle
    })
}


const askRegister = (cat) => {
    confirm(t('comps.are_you_sure_you_want_to_register'),null,() => {
        // send registration
        const payload = {
            compid : props.comp.id,
            category : cat.id,
        }
        isRegistering.value = true
        store.dispatch('registerToComp',payload)
        .then(ret => {
            toaster(ret.message)
        })
        .catch(err => toaster(handleValidationErrors(err)))
        .finally(() => {
            isRegistering.value = false

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
