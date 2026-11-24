<template>
  <h1 class="text-center font-bold text-2xl my-1 uppercase">
    new problems
  </h1>
  <f7-list>
    <f7-list-item
      title="Gyms you follow"
      smart-select
      :smart-select-params="{
        openIn: 'popup',
        searchbar: true,
        searchbarPlaceholder: 'Search gym',
        closeOnSelect: false,
      }"
    >
      <select name="gyms" multiple v-model="followedGyms">
        <option v-for="gym in gyms" :key="gym.id" :value="gym.id">{{ gym.name }}</option>
      </select>
    </f7-list-item>
  </f7-list>

  <div v-if="followedGyms.length === 0" class="text-center text-sm p-text-muted my-4">
    Pick one or more gyms above to see their newest routes.
  </div>

  <template v-for="group in groupedProblems" :key="group.gymid">
    <!-- One gym followed: no point labelling what's already obvious. -->
    <f7-block-title v-if="followedGyms.length > 1">{{ group.gymName }}</f7-block-title>
    <f7-list v-if="group.problems.length > 0" media class="p-2 my-0" problem-list>
      <new-problem-item
        v-for="item in group.problems"
        :key="item.id"
        :problem="item"
        @click="() => onStartNavigate(item)"
      >
      </new-problem-item>
    </f7-list>
  </template>
</template>
<script setup>
import { f7 } from 'framework7-vue'
import { computed, watch } from 'vue'
import { useQuery, useQueries } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { useGymStore } from '@js/stores/gym.store.js'
import { followedGyms } from '@js/followedGyms.js'
import NewProblemItem from '@components/feed/NewProblemItem.vue'
const gymStore = useGymStore()
const gymid = computed(() => gymStore.gymid)
const { data: gym } = useQuery({ ...queries.profile(gymid), select: (data) => data.gym })
const { data: gymsData } = useQuery({
  ...queries.gyms(),
  select: (data) => data.gyms,
  // placeholderData, not initialData: initialData is cached AS the answer, so
  // with the gym list's long staleTime an empty list counted as a fresh,
  // correct result and the query never ran — the picker sat on "Loading
  // gyms..." forever. placeholderData is only what to show while finding out.
  placeholderData: { gyms: [] },
})
const gyms = gymsData

// Nothing followed yet (first time on this device) — seed with the
// climber's current gym, the same single gym this page used to default to,
// so the feed isn't empty on arrival.
watch(gym, (val) => {
  if (followedGyms.value.length === 0 && val?.id != null) {
    followedGyms.value = [val.id]
  }
}, { immediate: true })

const problemQueries = useQueries({
  queries: () => followedGyms.value.map((id) => {
    const q = queries.newProblems(id)
    return { queryKey: q.queryKey, queryFn: q.queryFn }
  }),
})

const gymName = (id) => gyms.value?.find((g) => g.id === id)?.name ?? ''

const groupedProblems = computed(() =>
  followedGyms.value.map((id, index) => ({
    gymid: id,
    gymName: gymName(id),
    problems: problemQueries.value[index]?.data ?? [],
  }))
)

const onStartNavigate = (problem) => {
  f7.views.main.router.navigate('/problem/' + problem.id + '/popup', {
    props: { problem: problem },
  })
}
</script>
