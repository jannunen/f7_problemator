/**
 * Whether the Ada empty-state card should keep quiet after a climber has
 * already said no.
 *
 * should_offer is a fact about the climber (no coach, enough tick history)
 * that the backend re-derives on every load — it says nothing about whether
 * this particular climber has already been asked and declined. That half is
 * local to the device, the same way clearMarksOnOpen in trainingPrefs.js is:
 * a display preference, not something worth a column on the server for.
 *
 * Storage is passed in (defaulting to window.localStorage) rather than
 * imported directly, so the dismissal rule itself — the part worth getting
 * right — can be tested without a DOM.
 */

const KEY = 'ada.offer.dismissed'

const defaultStorage = () => (typeof localStorage !== 'undefined' ? localStorage : null)

/** Has this climber already dismissed the offer on this device? */
export function isAdaOfferDismissed(storage = defaultStorage()) {
  return storage?.getItem(KEY) === '1'
}

/** Record the dismissal so the card does not come back on the next load. */
export function dismissAdaOffer(storage = defaultStorage()) {
  storage?.setItem(KEY, '1')
}

/**
 * The card's actual show/hide rule, pulled out of the component so it has
 * one place to be tested. should_offer is the backend's call — see
 * VirtualCoachController::shouldOfferAda — and is never re-derived here; a
 * dismissal only ever narrows it further, never widens it.
 */
export function shouldShowAdaCard(shouldOffer, dismissed) {
  return !!shouldOffer && !dismissed
}
