<template>
    <div class="flex flex-row gap-2">
      <select name="wall" v-model="modeValue" @change="selectWall" class="p-select flex-1">
        <option :value="null">Filter by walls</option>
        <option
          v-for="w in wallsDropdown"
          :value="w.id"
          :selected="modelValue.includes(w.id)" :key="w.id"
        >
         {{ w.label}}
        </option>
      </select>
      <button class="p-btn p-btn--danger p-btn--sm" @click="clear">Clear</button>
    </div>

</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import { computed, ref } from 'vue'
const store = useStore()

const walls = computed(() => store.state.walls)
const wallsDropdown = computed(() => {
  return walls.value.map(a => ({ id: a.id, label: a.wallchar + " " + a.walldesc }))
})
const emit = defineEmits(['select', 'clear', 'update:modelValue'])
const props = defineProps({
  selected: Array,
  modelValue:
    { type: Array, default: [] },

})
const selectWall = (evt) => {
  const selectedOption = parseInt(evt.target.value)
  const newSelection = [...props.modelValue, selectedOption]
  emit('select', newSelection)
  emit('update:modelValue', newSelection)
}
const clear = () => {
  emit('clear')
}
</script>
