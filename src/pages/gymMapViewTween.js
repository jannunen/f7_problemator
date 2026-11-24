// Pure helpers behind the gym map's "zoom and slide to a tapped problem"
// animation, split out from GymMapPage.vue so the math is testable without
// mounting an SVG or driving a requestAnimationFrame loop.

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * The viewBox to animate to when a problem is tapped: centered on the
 * problem, zoomed to `focusW` — unless the view is already zoomed in
 * tighter than that, in which case it only slides, it never zooms out.
 */
export function focusViewBox(problem, currentViewBox, focusW) {
  const w = Math.min(currentViewBox.w, focusW)
  return {
    x: problem.cx - w / 2,
    y: problem.cy - w / 2,
    w,
    h: w,
  }
}

// Interpolates between two viewBoxes at progress t (0..1, already eased).
export function lerpViewBox(start, target, t) {
  return {
    x: start.x + (target.x - start.x) * t,
    y: start.y + (target.y - start.y) * t,
    w: start.w + (target.w - start.w) * t,
    h: start.h + (target.h - start.h) * t,
  }
}
