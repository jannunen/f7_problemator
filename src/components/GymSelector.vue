<template>
  <div>
    <f7-list class="m-0">
      <f7-list-item v-if="gyms.length == 0" title="Loading gyms...">
        <template #media>
          <i class="f7-icons">building_2_crop_circle</i>
        </template>
      </f7-list-item>
      <f7-list-item
        v-else
        :title="t('gymselector.active_gym')"
        smart-select
        :smart-select-params="{
          closeOnSelect: true,
          openIn: 'popup',
          searchbar: true,
          searchbarPlaceholder: 'Search gym',
        }"
      >
        <template #media>
          <i class="text-yellow-500  f7-icons">building_2_crop_circle</i>
        </template>
        <select @change="selectGym" name="active_gym">
          <!--<optgroup label="American">-->
          <option value="">No gym selected</option>
          <option
            :value="agym.id"
            v-for="agym in gyms"
            :key="agym.id"
            :selected="agym.id == gymid"
          >
            {{ agym.name }}
          </option>
          <!--</optgroup>-->
        </select>
      </f7-list-item>
    </f7-list>
  </div>
</template>
<script setup>
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import {  computed } from 'vue'
const { t } = useI18n()
const store = useStore()
const gyms = computed(() => store.state.gyms)
const emit = defineEmits(['select'])
store.dispatch('getGyms')
const gymid = computed(() => store.state.gymid)
const selectGym = ({ target }) => {
  const idx = target.selectedIndex
  const opt = target[idx]
  const selectedGym = opt.value
  console.log("Changing gym to",selectedGym)
  store.dispatch('changeGym', selectedGym)
  emit('select',selectedGym)
}
</script>
