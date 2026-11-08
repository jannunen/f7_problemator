export const CHECKPOINT_TYPES = ['checkpoint_points']
export const TOP_POINTS_TYPES = ['checkpoint_points', 'fixed_points_best_n']

/**
 * Picker options for one competition problem (pivot.checkpoints and
 * pivot.max_points): each checkpoint in order, then Top. A checkpoint's value
 * is its 1-based index, which is what the backend expects; Top's value is
 * 'top' and is recorded through the ordinary tick path, not as a checkpoint.
 * Mirrors the dashboard's helper of the same name.
 */
export function checkpointOptions(problem) {
  const pivot = problem?.pivot ?? {}
  const options = (pivot.checkpoints ?? []).map((c, i) => ({
    label: `Checkpoint ${i + 1}`,
    value: i + 1,
    points: Number(c.points),
  }))
  options.push({ label: 'Top', value: 'top', points: Number(pivot.max_points ?? 0) })
  return options
}

/** The climber's stored checkpoint index for a problem, from comp.my_checkpoints (object, or [] when empty). */
export function myCheckpointFor(mine, problemid) {
  if (mine == null || Array.isArray(mine)) return null
  const v = parseInt(mine[problemid])
  return isNaN(v) ? null : v
}
