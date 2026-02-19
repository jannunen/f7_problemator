<template>
  <f7-page>
    <f7-navbar>
      <f7-nav-left><f7-link href="/home">back</f7-link></f7-nav-left>
      <f7-nav-title>Top 10</f7-nav-title>
    </f7-navbar>
    <f7-block v-if="climber_id && ranking_id">
      <show-climber-top10
        :country="country"
        :first="first"
        :last="last"
        :climber_id="climber_id"
        :ranking_id="ranking_id"
        :route_type="route_type"
        :opened="true"
        @close="onClose"
      />
    </f7-block>
    <div v-else class="text-center py-12 p-text-muted text-sm">
      No ranking data available.
    </div>
  </f7-page>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import ShowClimberTop10 from '@components/ranking/ShowClimberTop10.vue'
const { t } = useI18n()

const props = defineProps({
  f7router: Object,
  climber_id: Number,
  ranking_id: Number,
  route_type: { type: String, default: 'all' },
  country: String,
  first: String,
  last: String,
})

const onClose = () => {
  if (props.f7router) {
    props.f7router.back()
  }
}
</script>
