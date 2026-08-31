/**
 * Formatting a price the backend sent, never one typed into a component.
 *
 * Stripe is the source of truth for what a climber is charged. Everything
 * here starts from amount_cents + currency off the wire; there is no default
 * price and no default currency, on purpose — a caller with nothing to show
 * should render nothing, not a number that quietly stops matching Stripe the
 * moment someone edits it there.
 */

/**
 * The app's own locale codes (see Home.vue's localeNames) mapped to a BCP47
 * tag Intl can format currency with. Intl accepts bare 'fi' or 'no' too, but
 * a full tag pins the digit grouping and symbol placement to one country
 * instead of "whichever the runtime defaults to" — and 'no' bare resolves to
 * nothing useful for Norwegian currency formatting.
 */
const LOCALE_TAGS = {
  en: 'en-GB',
  fi: 'fi-FI',
  es: 'es-ES',
  sv: 'sv-SE',
  et: 'et-EE',
  lt: 'lt-LT',
  lv: 'lv-LV',
  ge: 'ka-GE',
  fr: 'fr-FR',
  no: 'nb-NO',
  de: 'de-DE',
  it: 'it-IT',
  pl: 'pl-PL',
}

/**
 * amount_cents + currency, formatted for display in the given app locale.
 *
 * Returns null rather than throwing on incomplete input, so a caller can
 * render a loading state instead of "€NaN" while the query is still in
 * flight.
 */
export function formatMoney(amountCents, currency, locale) {
  if (amountCents == null || !currency) return null

  const tag = LOCALE_TAGS[locale] ?? locale ?? 'en-GB'

  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency,
  }).format(amountCents / 100)
}
