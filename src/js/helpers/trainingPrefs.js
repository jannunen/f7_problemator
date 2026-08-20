import { ref, watch } from 'vue'

const KEY = 'training.clearMarksOnOpen'

/**
 * Whether opening a day should clear its feedback mark.
 *
 * Off by default: a flag that clears the moment a screen renders is a flag
 * that clears while you are scrolling past it, and the note it pointed at is
 * then unfindable. A climber who would rather not tap can turn it on; one who
 * wants the marks to stay until they say so leaves it alone.
 *
 * Local to the device on purpose — it is a display preference, not something
 * a coach or another phone has any business changing.
 */
export const clearMarksOnOpen = ref(localStorage.getItem(KEY) === '1')

watch(clearMarksOnOpen, (on) => {
  localStorage.setItem(KEY, on ? '1' : '0')
})
