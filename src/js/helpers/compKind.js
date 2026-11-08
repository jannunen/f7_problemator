/**
 * Whether a competition's tyyppi means bouldering or sport judging.
 * Everything that is not 'sport' is bouldering (this includes checkpoint_points
 * and fixed_points_best_n); sport also matches sport-flavoured ids such as
 * 'sportbonus'. No bouldering type id contains "sport".
 */
export function isBoulderingCompType(tyyppi) {
  if (tyyppi == null) return false
  return tyyppi !== 'sport'
}

export function isSportCompType(tyyppi) {
  if (tyyppi == null) return false
  return tyyppi === 'sport' || /sport/.test(tyyppi)
}
