<template>
  <div class="flex flex-row h-12 gap-1">
    <button :class="getStyle('all')" @click="changeValue('all')" >{{ t('ascentstatusfilter.all') }}</button>
    <button :class="getStyle('projects')" @click="changeValue('projects')" >{{ t('ascentstatusfilter.projects') }}</button>
    <button :class="getStyle('climbed')" @click="changeValue('climbed')" >{{ t('ascentstatusfilter.climbed') }}</button>
    <button :class="getStyle('unclimbed')" @click="changeValue('unclimbed')" >{{ t('ascentstatusfilter.unclimbed') }}</button>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue:
    { type: String, default: 'all' },

})

const { t } = useI18n()
const getStyle = (field) => {
 if (props.modelValue == field) {
  return {'bg-red-500' : true}
 }
  return {'bg-blue-500' : true}
}
const emit = defineEmits(['select', 'clear', 'update:modelValue'])
const changeValue = (evt) => {
  emit('update:modelValue', evt)
}
const clear = () => {
  emit('clear')
}
</script>
