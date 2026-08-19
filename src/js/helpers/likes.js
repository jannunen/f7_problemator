/**
 * How many people like a problem.
 *
 * The API now sends likes_count, computed from the opinion rows that liking
 * actually writes. The c_like column on the problem row is a legacy counter
 * that nothing has maintained in years — it reads zero on every active route
 * — so it is only a fallback for any payload still carrying the old shape.
 */
export function likeCount(problem) {
  if (!problem) return 0
  return problem.likes_count ?? problem.c_like ?? 0
}
