<template>
    <div class="flex flex-row">
      <select name="wall" v-model="modeValue" @change="selectWall" class="m-0 h-20 bg-gray-50 border border-gray-300 text-gray-900 text focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      <option :value="null">Filter by walls</option>
      <option 
      v-for="w in wallsDropdown" 
      :value="w.id"
      :selected="modelValue.includes(w.id)" :key="w.id"
      >
       {{ w.label}}
       </option>
      </select>
      <button class="w-1/5 h-12  bg-red-500" @click="clear">Clear</button>
    </div>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
const store = useStore()

const oma = ref([])
const { t } = useI18n()
const walls = computed(() => store.state.walls)

const wallsDropdown = computed(() => {
  return walls.value.map(a => ({id : a.id, label : a.wallchar +" "+ a.walldesc }))
})
const emit = defineEmits(['select','clear','update:modelValue'])
const props = defineProps({
    selected : Array,
    modelValue : 
    { type : Array, default : []},

})
const selectWall = (evt) => {
  const selectedOption = parseInt(evt.target.value)
  const newSelection = [...props.modelValue,selectedOption]
  emit('select', newSelection)
  emit('update:modelValue',newSelection)
}
const clear = () => {
  emit('clear')
}
</script>
