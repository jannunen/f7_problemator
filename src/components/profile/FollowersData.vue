<template>
  <div class="border border-gray-700 flex justify-around">
    <div class="py-2 px-4 flex flex-col border-r border-gray-700 flex-1 text-center"  >
      <div class="text-sm text-gray-300">Following</div>
      <div class="text-lg font-bold">{{ profile.following?.length ?? 0}}</div>
    </div>
    <div class="py-2 px-4 flex flex-col border-r border-gray-700 flex-1 text-center"  >
      <div class="text-sm text-gray-300">Followers</div>
      <div class="text-lg font-bold">{{ profile.followers?.length ?? 0}}</div>
    </div>
    <div class="py-2 px-4 flex flex-col border-r border-gray-700 flex-1 text-center"  >
      
      <div>
      <div v-if="climber?.id != profile.id">
      <button v-if="amIFollowing" @click.prevent="followUnFollow(profile.id)" class="my-1 py-1 bg-blue-600 rounded-sm">UNFOLLOW</button>
      <button v-else @click.prevent="followUnFollow(profile.id)" class="my-1 py-1 bg-green-600 rounded-sm">FOLLOW</button>
      </div>
      <div v-else class="uppercase font-bold mt-2">This is you =)</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
const props = defineProps({
  profile: Object,
})
const store = useStore()
const climber = computed(() => store.state.climber)
const amIFollowing= computed(() => {
  if (climber.value == null) {
    return false
  }
  return props.profile.followers.find(x => x.follow_from == climber.value.id)
})
const followUnFollow = (id) => {
  store.dispatch('climbers/followUnFollow', id)
}
</script>
