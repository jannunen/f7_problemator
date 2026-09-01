/**
 * Pure reads over a coaching message thread, plus normalising what sending
 * into one hands back.
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
  // Called with store.state.climber?.id, which is undefined before the
  // climber has loaded. Filtering "!== undefined" against a real climber_id
  // is always true, so nobody gets excluded and the reader's own name would
  // otherwise print right along with the other participants'.
  if (myClimberId == null) return ''

  const others = (thread?.participants ?? []).filter((p) => p?.climber_id !== myClimberId)
  return others.map((p) => p?.name ?? '').filter(Boolean).join(', ')
}

/**
 * Coaches this climber could start a conversation with.
 *
 * Only those they do not already have a thread with — a second "Message
 * Ville" button beside an existing Ville thread invites a climber to create
 * a duplicate that the server would hand straight back anyway.
 *
 * `relationships` is what GET /training/coaches returns: the climber's active
 * coaching relationships, each carrying its coach. Nothing here is offered
 * for an ended one, because the server refuses those with 403 and a button
 * that can only fail is worse than no button.
 */
export function coachesToStartWith(relationships, threads) {
  const already = new Set(
    (threads ?? [])
      .map((t) => t?.coach_climber_id)
      .filter((id) => id != null)
  )

  return (relationships ?? [])
    .map((r) => ({
      climberId: r?.coach_climber_id ?? r?.coach?.id ?? null,
      name: r?.coach
        ? `${r.coach.etunimi ?? ''} ${r.coach.sukunimi ?? ''}`.trim()
        : '',
    }))
    .filter((c) => c.climberId != null && !already.has(c.climberId))
}

/**
 * Whether this climber is the coach in this thread.
 *
 * Used for both a participant in the list and the sender of a message, which
 * is why the thread carries one coach_climber_id rather than a boolean on
 * each participant.
 *
 * Guarded on both sides: an absent coach_climber_id must not make everyone a
 * coach, and an absent climber id must not match an absent coach id.
 */
export function isCoach(climberId, thread) {
  const coachId = thread?.coach_climber_id
  if (coachId == null || climberId == null) return false

  return Number(climberId) === Number(coachId)
}

/**
 * Normalises what POST /training/messages/{id} hands back.
 *
 * It used to return the created message row directly. Now that Ada, the AI
 * coach, can answer inline, it returns an envelope instead:
 * `{ message, coach_reply, coach_failed }`. `coach_reply` is Ada's answer,
 * produced synchronously in the same request so the climber sees it without
 * polling — it is absent when the thread is with a human coach, or when her
 * reply failed. `coach_failed` is true when the thread is with Ada but she
 * could not answer; the climber's own message is still saved either way.
 *
 * Defensive on both ends: a response with no `message` key is treated as an
 * old-style bare row, so a client talking to an unmigrated backend does not
 * crash the page; a missing `coach_reply` or `coach_failed` reads as "no
 * reply, nothing failed" rather than throwing.
 */
export function normalizeSendResult(sent) {
  return {
    message: sent?.message ?? sent ?? null,
    coachReply: sent?.coach_reply ?? null,
    coachFailed: sent?.coach_failed ?? false,
  }
}

