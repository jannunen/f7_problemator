import { ref, computed, watch } from 'vue'

/**
 * Grayscale / contrast / brightness for a spray wall photo.
 *
 * Spray wall photos are busy and often poorly lit, and the holds are exactly
 * what the climber is trying to pick out. Draining the colour or pushing the
 * contrast makes a marked hold stand out from the wall behind it.
 *
 * Module-level state on purpose: the setting is a property of the climber's
 * eyes and the gym's lighting, not of one screen. Adjusting it while building a
 * problem and then losing it when viewing that problem would be the wrong
 * behaviour, so the creator and the viewer share one value, persisted.
 */

const STORAGE_KEY = 'sprayWallPhotoAdjust'

const DEFAULTS = { grayscale: 0, contrast: 100, brightness: 100 }

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const saved = JSON.parse(raw)
    return {
      grayscale: Number.isFinite(saved.grayscale) ? saved.grayscale : DEFAULTS.grayscale,
      contrast: Number.isFinite(saved.contrast) ? saved.contrast : DEFAULTS.contrast,
      brightness: Number.isFinite(saved.brightness) ? saved.brightness : DEFAULTS.brightness,
    }
  } catch (e) {
    // A corrupt or unavailable localStorage must not stop the page rendering.
    return { ...DEFAULTS }
  }
}

const initial = load()

const grayscale = ref(initial.grayscale)
const contrast = ref(initial.contrast)
const brightness = ref(initial.brightness)

const photoFilter = computed(() => {
  const parts = []
  if (grayscale.value > 0) parts.push(`grayscale(${grayscale.value}%)`)
  if (contrast.value !== 100) parts.push(`contrast(${contrast.value}%)`)
  if (brightness.value !== 100) parts.push(`brightness(${brightness.value}%)`)
  return parts.length ? parts.join(' ') : 'none'
})

const isDefault = computed(
  () =>
    grayscale.value === DEFAULTS.grayscale &&
    contrast.value === DEFAULTS.contrast &&
    brightness.value === DEFAULTS.brightness
)

const reset = () => {
  grayscale.value = DEFAULTS.grayscale
  contrast.value = DEFAULTS.contrast
  brightness.value = DEFAULTS.brightness
}

watch([grayscale, contrast, brightness], ([g, c, b]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grayscale: g, contrast: c, brightness: b }))
  } catch (e) {
    // Private browsing or a full quota. Losing the preference is acceptable;
    // throwing here would take the page down with it.
  }
})

export function usePhotoAdjust() {
  return { grayscale, contrast, brightness, photoFilter, isDefault, reset }
}
