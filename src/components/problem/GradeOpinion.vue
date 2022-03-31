<template>
  <popup
    animate
    swipe-to-close
    @popup:closed="addTickSheetOpened = true"
    @popup:open="addTickSheetOpened = false"
    :opened="popupGradeOpinionOpen"
    class="popup_grade_opinion"
  >
    <h2>{{ t('problem.what_is_your_grade_opinion') }}</h2>
    <ul>
      <li
        @click="gradeOpinionSelected(null)"
        radio
        radio-icon="end"
        :title="$t('problem.no_opinion')"
        name="demo-radio-end"
        checked
      ></li>
      <li
        @click="() => gradeOpinionSelected(grade.id)"
        v-for="grade in grades"
        :key="grade.id"
        radio
        radio-icon="end"
        :title="grade.name"
        name="demo-radio-end"
      ></li>
    </ul>
    <div class="mx-2">
      <button @click="popupGradeOpinionOpen = false" large round fill color="blue">
        {{ t('global.close_action') }}
      </button>
    </div>
  </popup>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style></style>
