import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Climber identity — deliberately overloaded, same as the Vuex `climber`
 * state it replaces.
 *
 * Two unrelated sources write the SAME `climber` ref:
 *
 *   - `setFromProfile(climberData)`: the signed-in climber's own profile,
 *     called from queries.profile's queryFn on every successful fetch and
 *     from mutations.saveSettings's onSuccess.
 *   - `setFromPublicKey(climberData)`: the anonymous public point-entry
 *     identity looked up by a competition key, called from
 *     mutations.getClimberByKey's onSuccess.
 *
 * Whichever ran most recently wins — exactly the old `commit('climber', ...)`
 * mutation's behavior. This is a known overload, not a bug: separating it
 * into two fields would be a behavior-adjacent redesign outside this
 * migration's scope.
 */
export const useClimberStore = defineStore('climber', () => {
  const climber = ref(null)

  function setFromProfile(climberData) {
    climber.value = climberData
  }

  function setFromPublicKey(climberData) {
    climber.value = climberData
  }

  return { climber, setFromProfile, setFromPublicKey }
})
