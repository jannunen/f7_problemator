<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link href="/">login</f7-link></f7-nav-left>
      <f7-nav-title> {{ t('comps.standalone_competition_title') }} </f7-nav-title>
    </f7-navbar>
      <f7-block v-if="loading">
        <div class="notAuthorized" v-if="notAuthorized">
          <h3 class="text-center font-bold text-xl text--500 mt-2">Cannot open the competition</h3>
          <p class="text-center mt-2">
            <span v-if="notAuthorized">You are not authorized to access this competition. Usually this is because the competition key has expired.
              <br /><br />
              Ask the competition organizer to send the registration email again to regain access.
            </span>
          </p>
        </div>
        <div v-else class="text-center mt-2">Loading competition data...</div>
      </f7-block>
    <f7-block v-if="comp != null">
      <public-competition-entry :comp="comp" />
    </f7-block>

  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { mutations } from '@js/mutations.js'
import { useClimberStore } from '@js/stores/climber.store.js'
import { ref, computed } from 'vue'
import PublicCompetitionEntry from '@components/comps/PublicCompetitionEntry.vue'

const props = defineProps({
    compid : Number,
})
const { t } = useI18n()
const climberStore = useClimberStore()
const climber = computed(() => climberStore.climber)
const url = window.location.href
const urlParams = new URLSearchParams(url.split('?')[1])
const notAuthorized = ref(false)
// this key can be used to open the entry page without logging in
const key = urlParams.get('key')
const { mutate: getClimberByKeyMutate } = useMutation(mutations.getClimberByKey())
// Gates queries.publicCompetition below: the comp fetch only starts once
// the key has been confirmed to actually authorize this climber, matching
// the old flow (publicGetCompetition was only dispatched from inside
// getClimberByKey's own onSuccess, never unconditionally).
const authorized = ref(false)
if (key != null) {
  getClimberByKeyMutate({ compid: props.compid, key: key }, {
    onSuccess: (ret) => {
      // The mutation's own onSuccess already guards against writing this
      // string into the climber store; this is the separate UI decision —
      // whether to show the "not authorized" message — so the same check
      // is repeated here on purpose.
      if (ret != null && typeof ret == 'string' && ret.match(/access.to.this.comp/i)) {
        notAuthorized.value = true
      } else {
        authorized.value = true
      }
    },
  })
} else {
      alert('no valid competition key')
}

const { data: comp } = useQuery(queries.publicCompetition(computed(() => (authorized.value ? props.compid : null)), key))
// "loading" really means "nothing to show yet" — true while still waiting on
// the key check, the fetch, or (when the key turned out bad) forever, same
// as the old flow where loading only ever cleared on a successful fetch.
const loading = computed(() => comp.value == null)
</script>