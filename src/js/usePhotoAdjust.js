import { ref, computed } from 'vue'

/**
 * Grayscale / contrast / brightness for a spray wall photo.
 *
 * Two layers, in this order:
 *
 *   1. The gym's setting, saved on the image by whoever labelled it. They tuned
 *      it against the real wall in the real light, so it is the best available
 *      starting point and most climbers should never need to touch it.
 *   2. The climber's own, if they saved one. Eyes and phone screens differ, and
 *      someone who has found what works for them should not have to redo it.
 *
 * A personal setting is stored per wall, not globally: a dark overhang and a
 * bright slab in the same gym need different values, and one global override
 * would make the second wall worse every time it helped the first.
 *
 * "Reset" clears the personal setting and falls back to the gym's, rather than
 * to raw values — going back to what the gym intended is almost always what
 * someone means by resetting here.
 */

const STORAGE_KEY = 'sprayWallPhotoAdjust'

const AS_SHOT = { grayscale: 0, contrast: 100, brightness: 100 }

const readStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch (e) {
    // Corrupt or unavailable storage must not stop the wall rendering.
    return {}
  }
}

const writeStore = (all) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch (e) {
    // Private browsing or a full quota. Losing the preference is acceptable;
    // throwing here would take the page down with it.
  }
}

const sane = (value, fallback) => (Number.isFinite(value) ? value : fallback)

const normalise = (adjust) => ({
  grayscale: sane(adjust?.grayscale, AS_SHOT.grayscale),
  contrast: sane(adjust?.contrast, AS_SHOT.contrast),
  brightness: sane(adjust?.brightness, AS_SHOT.brightness),
})

// Shared across the creator and the viewer: both show the same wall, and a
// climber who adjusts one and then opens the other expects it to have carried.
const wallId = ref(null)
const gymDefault = ref({ ...AS_SHOT })
const grayscale = ref(AS_SHOT.grayscale)
const contrast = ref(AS_SHOT.contrast)
const brightness = ref(AS_SHOT.brightness)

const current = () => ({
  grayscale: grayscale.value,
  contrast: contrast.value,
  brightness: brightness.value,
})

const apply = (adjust) => {
  const next = normalise(adjust)
  grayscale.value = next.grayscale
  contrast.value = next.contrast
  brightness.value = next.brightness
}

/**
 * Called when a wall's photo loads. Applies the climber's own setting for this
 * wall if they saved one, otherwise the gym's.
 */
const useWall = (id, gymAdjust) => {
  wallId.value = id == null ? null : String(id)
  gymDefault.value = normalise(gymAdjust)

  const mine = wallId.value ? readStore()[wallId.value] : null
  apply(mine || gymDefault.value)
}

const photoFilter = computed(() => {
  const parts = []
  if (grayscale.value > 0) parts.push(`grayscale(${grayscale.value}%)`)
  if (contrast.value !== 100) parts.push(`contrast(${contrast.value}%)`)
  if (brightness.value !== 100) parts.push(`brightness(${brightness.value}%)`)
  return parts.length ? parts.join(' ') : 'none'
})

const matchesGym = computed(() => {
  const gym = gymDefault.value
  return (
    grayscale.value === gym.grayscale &&
    contrast.value === gym.contrast &&
    brightness.value === gym.brightness
  )
})

const hasMine = computed(() => !!(wallId.value && readStore()[wallId.value]))

// Saving is explicit rather than automatic. Dragging a slider to see what a
// hold looks like should not silently overwrite a setting that was working.
const saveMine = () => {
  if (!wallId.value) return
  const all = readStore()
  all[wallId.value] = current()
  writeStore(all)
}

const resetToGym = () => {
  if (wallId.value) {
    const all = readStore()
    delete all[wallId.value]
    writeStore(all)
  }
  apply(gymDefault.value)
}

export function usePhotoAdjust() {
  return {
    grayscale,
    contrast,
    brightness,
    photoFilter,
    matchesGym,
    hasMine,
    useWall,
    saveMine,
    resetToGym,
  }
}
