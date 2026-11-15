import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * The selected gym id.
 *
 * Split into its own tiny store rather than folded into ui.store.js: `ready`
 * et al there are session-wide UI flags with no gym in them at all, while
 * `gymid` is the one piece of state every gym-scoped query (badges,
 * newProblems, sprayWalls, profile, ...) and gym-scoped component already
 * keys off directly — giving it its own file matches how `auth.store.js` and
 * `ui.store.js` are already split by what they are about, not bundling two
 * unrelated concerns into one file because both happen to be small.
 *
 * Seeded from localStorage exactly like auth.store.js seeds accessToken from
 * a stored token: a returning climber's last gym must read correctly on the
 * very first render, not only after `changeGym` happens to run again.
 */
function readStoredGymid() {
  try {
    return localStorage.getItem('gymid')
  } catch {
    // No localStorage at all: a test runner, or a browser with site data
    // blocked. No remembered gym is the safe reading of "cannot tell".
    return null
  }
}

export const useGymStore = defineStore('gym', () => {
  const gymid = ref(readStoredGymid())

  function setGymid(id) {
    gymid.value = id
  }

  return { gymid, setGymid }
})
