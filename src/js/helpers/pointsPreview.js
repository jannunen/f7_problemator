// What a climber who has NOT topped a route yet would be credited for topping
// it now, from the backend's `points_if_topped` ({ "1": x, "2": y, other: z }).
// Returns null when there is nothing to preview (already topped, or an older
// backend that does not send the field).
export const previewPoints = (problem, tries, topped) => {
  const map = problem?.points_if_topped
  if (topped || map == null || typeof map !== 'object') return null
  const key = String(Math.max(1, parseInt(tries, 10) || 1))
  const value = map[key] ?? map.other
  return value == null ? null : value
}
