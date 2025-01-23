<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link href="/">login</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.standalone_competition_title') }} </f7-nav-title>
    </f7-navbar>
      <f7-block v-if="loading">
        <div class="text-center mt-2">Loading competition data...</div>
      </f7-block>
    <f7-block v-if="comp != null">
      <public-competition-entry :comp="comp" />
    </f7-block>

  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import { ref, onMounted, computed, watch } from 'vue'
import PublicCompetitionEntry from '@components/comps/PublicCompetitionEntry.vue'

const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const store = useStore()
const comp = computed(() => store.state.competition)
const climber = computed(() => store.state.climber)
const url = window.location.href
const urlParams = new URLSearchParams(url.split('?')[1])
// this key can be used to open the entry page without logging in
const key = urlParams.get('key')
if (key != null) {
  store.dispatch('getClimberByKey', { compid: props.compid, key: key },'/compkey')
  .then(() => {
    store.dispatch('publicGetCompetition',{compid:props.compid, point_entry_key: key})
    .then(() => loading.value=false)
  })
} else {
      /*
      store.dispatch('getCompetition',{compid:props.compid})
      .then(() => loading.value=false)
      */
      alert('no valid competition key')
}


const loading = ref(true)
watch(key,() => {
  store.dispatch('publicGetCompetition',{compid:props.compid, point_entry_key: key})
  .then(() => loading.value=false)
})
onMounted(() => {
})
</script>