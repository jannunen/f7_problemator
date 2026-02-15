<template>
  <div class="p-toggle-group">
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': modelValue === 'all' }"
      @click="changeValue('all')"
    >{{ t('ascentstatusfilter.all') }}</button>
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': modelValue === 'projects' }"
      @click="changeValue('projects')"
    >{{ t('ascentstatusfilter.projects') }}</button>
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': modelValue === 'climbed' }"
      @click="changeValue('climbed')"
    >{{ t('ascentstatusfilter.climbed') }}</button>
    <button
      class="p-toggle-group__btn"
      :class="{ 'p-toggle-group__btn--active': modelValue === 'unclimbed' }"
      @click="changeValue('unclimbed')"
    >{{ t('ascentstatusfilter.unclimbed') }}</button>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue:
    { type: String, default: 'all' },

})

const { t } = useI18n()
const emit = defineEmits(['select', 'clear', 'update:modelValue'])
const changeValue = (evt) => {
  emit('update:modelValue', evt)
}
const clear = () => {
  emit('clear')
}
</script>
