import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@js/api'

/**
 * Rankings view state: the climber's chosen ranking scope (`rankingTarget`,
 * 'global' or a country code) and the last-fetched `rankings` payload for
 * it.
 *
 * Stays a Pinia store rather than a TanStack query: per the design doc,
 * nothing else caches or invalidates "the current ranking view" — it's view
 * state tied 1:1 to this store's own `rankingTarget` choice, not a shared
 * server resource multiple independent queries read.
 *
 * `rankingTarget` seeds once from the profile payload's gym country
 * (queryKeys.js's `profile` queryFn calls `seedFromProfile` on every
 * successful fetch) and is authoritative after that: an explicit
 * `setRankingTarget` call (the climber toggling between their gym's country
 * and global) always wins immediately, and also blocks any seed attempt
 * that runs later — a gym switch or a saveSettings-triggered profile
 * refetch must never silently overwrite an already-established or
 * explicitly-chosen target. The internal `seeded` ref tracks this
 * explicitly rather than relying on "last write wins".
 */
export const useRankingsStore = defineStore('rankings', () => {
  const rankingTarget = ref('global')
  const rankings = ref(null)
  const seeded = ref(false)

  function setRankingTarget(country) {
    rankingTarget.value = country
    seeded.value = true
  }

  function seedFromProfile(country) {
    if (seeded.value || country == null) return
    rankingTarget.value = country
    seeded.value = true
  }

  // Ports the old Vuex `rankings` action's body. `url` carries a pagination
  // link (ShowRanking.vue's first/prev/next/last page buttons); omit it for
  // a plain fetch at the current rankingTarget.
  async function fetchRankings(url = null) {
    const ret = await api.ranking({ url, country: rankingTarget.value })
    rankings.value = ret
    return ret
  }

  return { rankingTarget, rankings, setRankingTarget, seedFromProfile, fetchRankings }
})
