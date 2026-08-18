<template>
  <svg
    :viewBox="glyph.viewBox"
    :width="size"
    :height="size"
    fill="currentColor"
    role="img"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    focusable="false"
  >
    <path :d="glyph.path" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

/**
 * The three icons the app draws, as inline SVG.
 *
 * These used to come from a FontAwesome Pro kit script loaded from
 * kit.fontawesome.com in index.html. That is fine on the web, where the
 * kit's allowlisted domain is pwa.problemator.fi, but the packaged apps
 * load from capacitor://localhost (iOS) and https://localhost (Android).
 * A Pro kit refuses to serve an origin it does not recognise, so every
 * icon would have quietly gone missing in the store builds — and even
 * where it did load, it is a render-blocking request to a third party on
 * every cold start, and three blank spaces on a gym's dead wifi.
 *
 * Paths are FontAwesome Free 6 Solid (CC BY 4.0), so nothing here depends
 * on the Pro licence. SocialButtons.vue already inlines its brand marks
 * the same way.
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: '1em' },
  // Icons that carry meaning on their own need a label; decorative ones
  // beside existing text should stay out of the accessibility tree.
  label: { type: String, default: '' }
})

const GLYPHS = {
  heart: {
    viewBox: '0 0 512 512',
    path: 'M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z'
  },
  'location-dot': {
    viewBox: '0 0 384 512',
    path: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z'
  },
  user: {
    viewBox: '0 0 448 512',
    path: 'M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z'
  }
}

const EMPTY = { viewBox: '0 0 1 1', path: '' }

// Computed rather than resolved once at setup, so a bound :name still
// works. A name with no glyph is a typo, and a typo that renders nothing
// is one you find in a screenshot from a user — so say so in dev, and
// draw nothing in production rather than throwing mid-render.
const glyph = computed(() => {
  const found = GLYPHS[props.name]
  if (!found) {
    if (import.meta.env.DEV) console.error(`Icon: unknown name "${props.name}"`)
    return EMPTY
  }
  return found
})
</script>
