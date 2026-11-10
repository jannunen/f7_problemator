export const CHECKPOINT_TYPES = ['checkpoint_points']
export const TOP_POINTS_TYPES = ['checkpoint_points', 'fixed_points_best_n']

/** Comp types scored from tries-to-bonus + tries-to-top (a single zone/bonus hold). */
export const TRIES_AND_BONUS_TYPES = ['traditional', 'ifsc_2018_bouldering', 'flashcomp']

/**
 * Picker options for one competition problem (pivot.checkpoints and
 * pivot.max_points): each checkpoint in order, then Top. A checkpoint's value
 * is its 1-based index, which is what the backend expects; Top's value is
 * 'top' and is recorded through the ordinary tick path, not as a checkpoint.
 * A checkpoint's label is the routesetter's custom name (trimmed), or null when
 * absent or blank; callers fall back to the translated 'Checkpoint N' text.
 * Mirrors the dashboard's helper of the same name.
 */
export function checkpointOptions(problem) {
  const pivot = problem?.pivot ?? {}
  const options = (pivot.checkpoints ?? []).map((c, i) => ({
    label: typeof c.label === 'string' && c.label.trim() !== '' ? c.label.trim() : null,
    value: i + 1,
    points: Number(c.points),
  }))
  options.push({ label: 'Top', value: 'top', points: Number(pivot.max_points ?? 0) })
  return options
}

/**
 * Display text for one checkpoint position: the routesetter's custom label
 * when set, otherwise the localized 'Checkpoint N' fallback (unchanged from
 * before labels existed). value === 'top' always uses the dedicated 'Top'
 * translation, ignoring any label, matching today's behavior.
 */
export function checkpointDisplayLabel(options, value, t) {
  if (value === 'top') return t('comps.top')
  const opt = (options ?? []).find((o) => o.value === value)
  return opt?.label || t('comps.checkpoint_n', { n: value })
}

/** The climber's stored checkpoint index for a problem, from comp.my_checkpoints (object, or [] when empty). */
export function myCheckpointFor(mine, problemid) {
  if (mine == null || Array.isArray(mine)) return null
  const v = parseInt(mine[problemid])
  return isNaN(v) ? null : v
}
