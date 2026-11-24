/**
 * A category's cap in one competition, or null when it has none. The cap is
 * on the pivot (comp_serie_in_comp.maxparticipants), not on the category,
 * and the backend reads both null and 0 as "no limit".
 */
export const categoryCap = (cat) => {
  const cap = parseInt(cat?.pivot?.maxparticipants)
  return cap > 0 ? cap : null
}

/**
 * Full when the confirmed participants reach the cap: the same count the
 * backend refuses a registration on. Unconfirmed ones do not hold a spot.
 */
export const isCategoryFull = (cat) => {
  const cap = categoryCap(cat)
  return cap != null && (cat?.participants?.length ?? 0) >= cap
}

/** Spots left once `taken` are gone, never below zero; null when there is no cap. */
export const spotsLeft = (cat, taken) => {
  const cap = categoryCap(cat)
  return cap == null ? null : Math.max(0, cap - taken)
}
