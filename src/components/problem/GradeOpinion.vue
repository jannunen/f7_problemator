<template>
  <f7-popup animate :opened="opened" class="popup_grade_opinion">
    <f7-page>
      <f7-navbar :title="t('problem.what_is_your_grade_opinion')">
        <f7-nav-right>
          <f7-link @click.prevent="emit('close')">Close</f7-link>
        </f7-nav-right>
      </f7-navbar>
      <f7-block>
        <f7-list>
          <f7-list-item
            @click="gradeOpinionSelected(null)"
            :title="t('problem.no_opinion')"
            name="demo-radio-end"
            checked
          ></f7-list-item>
          <f7-list-item
            @click="() => gradeOpinionSelected(grade.id)"
            v-for="grade in grades"
            :key="grade.id"
            :title="grade.name"
          ></f7-list-item>
        </f7-list>
        <div class="mx-2 my-2">
          <f7-button @click="emit('close')" large fill>
            {{ t('global.close_action') }}
          </f7-button>
        </div>
      </f7-block>
    </f7-page>
  </f7-popup>
</template>

<script setup>
import store from '@js/store.js'
import { useStore } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const props = defineProps({
  opened: Boolean,
  grades: Array,
})
const emit = defineEmits(['close', 'select'])
const grades = useStore('grades')
const gradeOpinionSelected = (gradeid) => {
  emit('select', gradeid)
}
</script>

<style></style>
