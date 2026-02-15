<template>
  <div class="gym-selector">
    <f7-list class="m-0">
      <f7-list-item v-if="gyms.length == 0" title="Loading gyms...">
        <template #media>
          <span class="material-icons" style="color: var(--p-text-dim);">apartment</span>
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
          <span class="material-icons" style="color: var(--p-accent);">apartment</span>
        </template>
        <select @change="selectGym" name="active_gym">
          <option value="">No gym selected</option>
          <option
            :value="agym.id"
            v-for="agym in gyms"
            :key="agym.id"
            :selected="agym.id == gymid"
          >
            {{ agym.name }}
          </option>
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
<style scoped>
.gym-selector :deep(.list) {
  --f7-list-bg-color: rgba(255, 255, 255, 0.04);
  --f7-list-item-border-color: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  margin: 0.5rem 1rem;
  overflow: hidden;
}
.gym-selector :deep(.item-title) {
  font-size: 0.85rem;
  color: var(--p-text-muted);
}
.gym-selector :deep(.item-after) {
  color: var(--p-text);
  font-weight: 600;
}
</style>
