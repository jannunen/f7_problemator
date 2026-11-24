import { ref, watch } from 'vue'

const KEY = 'feed.followedGyms'

/**
 * Gym ids whose "new problems" feed this climber wants to see, together —
 * not just the one gym currently selected in the app. Local to the device:
 * there is no backend concept of a followed-gyms list, this is purely what
 * NewProblems.vue remembers to pre-select next time.
 */
export const followedGyms = ref(JSON.parse(localStorage.getItem(KEY)) || [])

watch(followedGyms, (ids) => {
  localStorage.setItem(KEY, JSON.stringify(ids))
}, { deep: true })
