<template>
  <div>
    {{selectedWalls}}
    <f7-list class="mx-0 my-2">
      <f7-list-item
        :title="t('wallselector.active_wall')"
        smart-select
        :smart-select-params="{
          closeOnSelect: true,
          openIn: 'popup',
          searchbar: true,
          searchbarPlaceholder: 'Search walls',
        }"
      >
        <select @change="selectWall" name="active_wall">
          <option
            :value="awall.id"
            v-for="awall in walls"
            :key="awall.id"
            :selected="modelValue.includes(awall.id)"
          >
            {{ awall.wallchar }} {{ awall.walldesc }}
          </option>
        </select>
      </f7-list-item>
      <f7-list-button @click="clear"> Clear wall filter </f7-list-button>
    </f7-list>
  </div>
</template>
<script setup>
import { useStore } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
const { t } = useI18n()
const gyms = ref([])
const walls = useStore('walls')
const emit = defineEmits(['select','clear','update:modelValue'])
const gym = useStore('gym')
const props = defineProps({
    selected : Array,
    modelValue : 
    { type : Array, default : []},

})
const selectWall = ({ target }) => {
  const selectedOptions = [...target.selectedOptions]
  const ids = selectedOptions.map(item => parseInt(item.value))
  emit('select', ids)
  emit('update:modelValue',ids)
}
const clear = () => {
  emit('clear')
}
</script>
