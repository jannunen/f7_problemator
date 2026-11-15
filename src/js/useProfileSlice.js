import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'

/**
 * One slice of the profile/bootstrap payload, never undefined.
 *
 * Components read gym/grades/walls/styles off queries.profile(gymid) with a
 * `select`. TanStack never calls `select` while there is no data — on a cold
 * start, and right after a gym switch until the new gym's payload lands — so
 * `data` is undefined then, whatever the selector would have returned. The
 * Vuex state this replaced always held a default (`gym: { problems: [] }`,
 * `grades: []`, `walls: []`, `styles: []`), and the templates and computeds
 * ported from it still dereference as if one were there: `gym.name`,
 * `walls.value.filter`, `grades.value.forEach` all threw during render.
 *
 * This puts the default back in one place, so a call site cannot forget it.
 * The fallback is used both while there is no data and when the payload
 * itself lacks the field (a climber with no gym chosen gets no `gym`).
 *
 * Pass the fallback as a fresh literal at each call (the helpers below do):
 * a call site that sorts or pushes into it then only touches its own copy.
 */
export function useProfileSlice(gymid, selector, fallback) {
  const { data } = useQuery({ ...queries.profile(gymid), select: selector })
  return computed(() => data.value ?? fallback)
}

/** The selected gym, defaulting to the old Vuex shape. */
export const useProfileGym = (gymid) =>
  useProfileSlice(gymid, (d) => d.gym, { problems: [] })

/** The gym's walls. */
export const useProfileWalls = (gymid) =>
  useProfileSlice(gymid, (d) => d.gym?.walls, [])

/** The gym's grade scale. */
export const useProfileGrades = (gymid) =>
  useProfileSlice(gymid, (d) => d.grades, [])

/** The gym's route styles. */
export const useProfileStyles = (gymid) =>
  useProfileSlice(gymid, (d) => d.styles, [])

/**
 * The gym's problems, keyed by id — not the raw `gym.problems` array the
 * backend returns (and that `queries.profile`'s cache still holds
 * untouched), but reshaped exactly the way the old Vuex
 * `store.commit('problems', ...)` bridge reshaped it (`acc[prob.id] = prob`).
 *
 * Every current consumer (ExpiringProblemsAlert, AttributeRadar,
 * GymCompletionPage, ProblemList, GymMapPage) destructures this with
 * `Object.keys`/`Object.values`/bracket-by-id lookups — the array shape
 * would not satisfy any of them without first undoing this same reshape
 * in every call site.
 *
 * mutations.js patches the RAW array in the cache (see its own
 * patchGymProblems), not this id-keyed view — this selector runs again,
 * fresh, on every render, so a patch to the array is automatically
 * reflected here with no separate bridge to keep in sync.
 */
export const useProfileProblems = (gymid) =>
  useProfileSlice(
    gymid,
    (d) =>
      (d.gym?.problems ?? []).reduce((acc, prob) => {
        acc[prob.id] = prob
        return acc
      }, {}),
    {}
  )
