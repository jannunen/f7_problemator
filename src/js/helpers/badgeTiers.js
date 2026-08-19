/**
 * Badges that come in levels.
 *
 * A tier_group is one award that gains weight — 1 year strong through 50,
 * bronze through platinum, 6a through 9a. Showing every rung a climber has
 * passed turns a wall of achievement into a wall of noise, so a group
 * collapses to two things: the highest level earned, and the next one to
 * chase.
 *
 * Rungs are ordered by sort_order, which is how the seed lays every ladder
 * out. A badge with no tier_group is a group of one and passes straight
 * through.
 */
export function groupTiers(definitions = [], earnedIds = new Set()) {
  const groups = new Map()

  for (const def of definitions) {
    // Ungrouped badges each get their own bucket, keyed so they can never
    // collide with a real group name.
    const key = def.tier_group || `single:${def.id}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(def)
  }

  const out = []
  for (const [key, rungs] of groups) {
    rungs.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const earned = rungs.filter((r) => earnedIds.has(r.id))
    const current = earned.length ? earned[earned.length - 1] : null
    const next = rungs.find((r) => !earnedIds.has(r.id)) ?? null

    out.push({
      key,
      rungs,
      current,
      next,
      total: rungs.length,
      earnedCount: earned.length,
      // Which rung the shown badge is, for "Level 3 of 14" in the detail sheet.
      levelOf: (badge) => rungs.findIndex((r) => r.id === badge?.id) + 1,
    })
  }

  return out.sort((a, b) => {
    const av = a.current ?? a.next
    const bv = b.current ?? b.next
    return (av?.sort_order ?? 0) - (bv?.sort_order ?? 0)
  })
}

/** One medal per group: what you have, or what you are working towards. */
export function collapsedBadges(definitions, earnedIds) {
  return groupTiers(definitions, earnedIds)
    .map((g) => g.current ?? g.next)
    .filter(Boolean)
}
