<template>
  <h1 class="text-center font-bold text-2xl my-1 uppercase">
    new problems
  </h1>
  <f7-list>
    <f7-list-item
      title="Selected gym"
      smart-select
      :smart-select-params="{
        openIn: 'popup',
        searchbar: true,
        searchbarPlaceholder: 'Search gym',
        closeOnSelect: true,
      }"
    >
      <select name="gym" v-model="selectedGym" @change="onChangeGym">
        <option v-for="gym in gyms" :value="gym.id">{{ gym.name }}</option>
      </select>
    </f7-list-item>
  </f7-list>
  <f7-list v-if="problems.length > 0" media class="p-2 my-0" problem-list>
    <new-problem-item
      v-for="item in problems"
      :key="item.id"
      :problem="item"
      @click="() => onStartNavigate(item)"
    >
    </new-problem-item>
  </f7-list>
</template>
<script setup>
import { f7 } from 'framework7-vue'
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useQuery } from '@tanstack/vue-query'
import NewProblemItem from '@components/feed/NewProblemItem.vue'
import api from '@js/api'
const store = useStore()
const gym = computed(() => store.state.gym)
const { data: gymsData } = useQuery({
  queryKey: ['gyms'],
  queryFn: () => api.getGyms(),
  select: (data) => data.gyms,
  initialData: { gyms: [] },
})
const gyms = gymsData
const selectedGym = ref(gym.value?.id || null)
watch(gym, (val) => {
  selectedGym.value = val.id
})

const { data: problems } = useQuery({
  queryKey: computed(() => ['newProblems', selectedGym.value]),
  queryFn: () => api.newProblems(selectedGym.value),
  enabled: computed(() => selectedGym.value != null),
  initialData: [],
})

const onChangeGym = () => {
  // Query auto-refetches when selectedGym changes in the queryKey
}

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem: problem },
  })
}
</script>
