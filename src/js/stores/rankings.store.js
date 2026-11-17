import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@js/api'
import { useGymStore } from '@js/stores/gym.store.js'

// rankingTarget value meaning "the climber's currently selected gym".
export const GYM_TARGET = 'gym'

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
  // The gym id the current `rankings` were fetched for (null for country/global).
  const rankingsGymid = ref(null)
  // True when the backend refused the gym (422/404: unpublished or unknown).
  const gymUnavailable = ref(false)
  let requestSeq = 0

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
    const gymid = rankingTarget.value === GYM_TARGET ? useGymStore().gymid : null
    const seq = ++requestSeq
    gymUnavailable.value = false
    if (rankingTarget.value === GYM_TARGET && gymid == null) {
      // Gym scope without a selected gym: nothing to ask for.
      rankings.value = []
      rankingsGymid.value = null
      return rankings.value
    }
    try {
      const ret = await api.ranking({ url, country: rankingTarget.value, gym: gymid })
      // A newer request (scope toggled, gym switched) has superseded this one:
      // its answer must not overwrite the list the climber is now looking at.
      if (seq !== requestSeq) return ret
      rankings.value = ret
      rankingsGymid.value = gymid
      return ret
    } catch (e) {
      if (gymid != null && [404, 422].includes(e?.response?.status)) {
        if (seq === requestSeq) {
          gymUnavailable.value = true
          rankings.value = []
          rankingsGymid.value = gymid
        }
        return []
      }
      throw e
    }
  }

  // Back to a fresh store, for auth.store's logout(): without it, `seeded`
  // stays true across a climber swap and the next climber's first profile
  // fetch can never seed their own scope — they inherit the previous one's.
  function reset() {
    rankingTarget.value = 'global'
    rankings.value = null
    seeded.value = false
    rankingsGymid.value = null
    gymUnavailable.value = false
    requestSeq++
  }

  return { rankingTarget, rankings, rankingsGymid, gymUnavailable, setRankingTarget, seedFromProfile, fetchRankings, reset }
})
