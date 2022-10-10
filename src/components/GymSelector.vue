<template>
  <div>
    <f7-list class="m-0">
      <f7-list-item v-if="gyms.length == 0" title="Loading gyms...">
        <template #media>
          <f7-skeleton-block style="width: 40px; height: 40px"></f7-skeleton-block>
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
          <f7-skeleton-block style="width: 40px; height: 40px"></f7-skeleton-block>
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
import {  computed, ref } from 'vue'
const { t } = useI18n()
const store = useStore()

const gyms = computed(() => store.state.gyms)
store.dispatch('getGyms')
const gymid = computed(() => store.state.gymid)
const selectGym = ({ target }) => {
  const idx = target.selectedIndex
  const opt = target[idx]
  const selectedGym = opt.value
  console.log("Changing gym to",selectedGym)
  store.dispatch('changeGym', selectedGym)
}
</script>
