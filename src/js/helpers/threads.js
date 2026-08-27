/**
 * Pure reads over a coaching message thread.
 *
 * Relations and counts arrive absent rather than null from this API — a
 * thread with nothing unread has no `unread_count` key at all, and a thread
 * fetched without its participants has none of those either. Every read here
 * is guarded for that, because the caller on the other end is either a home
 * screen badge (NaN would be silent and wrong) or a list row (undefined
 * would render nothing and look broken).
 */

/** How much is waiting across every thread, for the home card's dot. */
export function unreadTotal(threads) {
  return (threads ?? []).reduce((sum, thread) => sum + (thread?.unread_count ?? 0), 0)
}

/**
 * Who a thread is with, from the reader's point of view.
 *
 * A 1:1 thread names the other person. Phase 2 adds group threads with
 * several other participants; joining all of their names is the sane default
 * until that phase decides otherwise.
 */
export function threadTitle(thread, myClimberId) {
  const others = (thread?.participants ?? []).filter((p) => p?.climber_id !== myClimberId)
  return others.map((p) => p?.name ?? '').filter(Boolean).join(', ')
}
