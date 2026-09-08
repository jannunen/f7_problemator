/**
 * "Stop the training" means three separate things, and this file is where
 * the app keeps them apart.
 *
 * A climber can end the programme, end the coaching, or end the
 * subscription. Doing one does not do the others — the server keeps them
 * deliberately independent — so the interface has to name which one it is
 * about every time, and never imply a button did more than it did.
 *
 * The decisions live here rather than in the components because they are the
 * part worth testing: opening a Stripe URL and rendering a dialog are not,
 * and live in externalWindow.js and the pages themselves.
 *
 * The third of the three — whether there is a subscription to cancel at all
 * — already had a home in adaSubscription.js, so it stays there and is
 * imported: two functions answering "did this climber ever reach Stripe?"
 * would eventually answer it differently.
 */
import { canManageSubscription } from './adaSubscription.js'

/**
 * Whether the subscription has been cancelled in Stripe's portal but has
 * not run out yet.
 *
 * `status` stays 'active' for this entire window — Stripe's portal cancel
 * sets cancel_at_period_end and only deletes the subscription when the paid
 * period actually ends. So this flag is the only thing separating a climber
 * who is staying from one who has already left, and without it the app shows
 * them exactly the same screen.
 */
export function isWindingDown(state) {
  return !!state?.cancel_at_period_end && state?.status !== 'canceled'
}

/**
 * The date access actually runs out, as a Date, or null when there is none
 * to show.
 *
 * The server sends one field for both clocks (a trial's end and a paid
 * period's end are the same question asked twice), so there is nothing to
 * choose between here — only a string to parse, and a guard so a malformed
 * one renders nothing rather than "Invalid Date".
 */
export function accessEndsAt(state) {
  const raw = state?.access_until
  if (!raw) return null

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Whether to offer "stop working with Ada" at all.
 *
 * Only while there is a relationship to end. A climber who has already
 * fired her, or never hired her, is shown the hire path instead — offering
 * both at once reads as a broken screen.
 */
export function canEndCoaching(state) {
  return !!state?.hired && !!state?.relationship_id
}

/**
 * What ending the coaching leaves behind, as a list of warning keys for the
 * confirmation dialog.
 *
 * This exists so the dialog cannot quietly get out of step with what the
 * server does. Ending a relationship writes one row and touches nothing
 * else: any active programme stays with the climber, and any live
 * subscription keeps billing. Both are surprising enough to be worth saying,
 * but only when they are actually true — warning about a subscription
 * somebody does not have is noise, and noise is what stops warnings working.
 */
export function endCoachingWarnings(state, { hasActiveProgramme = false } = {}) {
  const warnings = []

  if (hasActiveProgramme) warnings.push('programme_stays')

  // A trial costs nothing and expires by itself, so there is nothing to warn
  // about; a subscription that is already winding down is going to stop on
  // its own too, and telling someone mid-cancellation that they will keep
  // being charged would be simply untrue.
  if (canManageSubscription(state?.status) && !isWindingDown(state)) warnings.push('subscription_stays')

  return warnings
}
