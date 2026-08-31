<template>
  <f7-page name="ada-explainer">
    <f7-navbar :title="t('ada.explainer_title')" back-link></f7-navbar>

    <p v-if="!data" class="ada__note">{{ t('ada.loading') }}</p>

    <template v-else>
      <!-- First, plainly, not buried at the bottom — this is a standing
           commitment Ada's own system prompt makes (resources/coaching/ada.md
           on the backend), and this wording must not contradict it. -->
      <div class="ada__disclosure">
        <span class="material-icons ada__disclosure-icon">smart_toy</span>
        <span>{{ t('ada.disclosure') }}</span>
      </div>

      <!-- A climber who has actually paid at some point (active, past_due,
           or cancelled but not simply on the trial) can manage that
           subscription from here regardless of whether they are currently
           hired — this is about the Stripe subscription, not the coaching
           relationship. Shown only when there is something to manage:
           VirtualCoachController::portal() 422s for anyone who never went
           through Checkout, and canManageSubscription mirrors that gate so
           the entry point simply is not offered rather than failing. -->
      <div v-if="canManage" class="ada__manage">
        <f7-button outline small :disabled="managing" @click="manageSubscription">
          {{ managing ? t('ada.manage_pending') : t('ada.manage_subscription') }}
        </f7-button>
        <p v-if="manageError" class="ada__error">{{ manageError }}</p>
      </div>

      <section class="ada__section">
        <h3 class="ada__heading">{{ t('ada.does_title') }}</h3>
        <ul class="ada__list">
          <li>{{ t('ada.does_programme') }}</li>
          <li>{{ t('ada.does_adjusts') }}</li>
          <li>{{ t('ada.does_reviews') }}</li>
        </ul>
      </section>

      <section class="ada__section">
        <h3 class="ada__heading">{{ t('ada.not_title') }}</h3>
        <ul class="ada__list">
          <li>{{ t('ada.not_physio') }}</li>
          <li>{{ t('ada.not_weight') }}</li>
        </ul>
      </section>

      <section class="ada__section ada__pricing">
        <h3 class="ada__heading">{{ t('ada.trial_title') }}</h3>
        <p>{{ t('ada.trial_body', { days: data.trial_days }) }}</p>
        <p v-if="priceLabel">{{ t('ada.price_body', { price: priceLabel, period: periodLabel }) }}</p>
      </section>

      <p v-if="hireError" class="ada__error">{{ hireError }}</p>

      <!-- The trial-is-over case, split out from the plain hireError text
           above: it is not a failure, it is a climber who liked Ada enough
           to come back with nothing to buy the return with. Replaces the
           dead end with the one action that actually continues. -->
      <div v-if="needsSubscription" class="ada__subscribe">
        <p>{{ t('ada.trial_used_error') }}</p>
        <f7-button large fill :disabled="subscribing" @click="subscribe">
          {{ subscribing ? t('ada.subscribe_pending') : t('ada.subscribe_button', { price: priceLabel, period: periodLabel }) }}
        </f7-button>
        <p v-if="subscribeError" class="ada__error">{{ subscribeError }}</p>
      </div>

      <div v-else class="ada__actions">
        <f7-button large fill :disabled="hiring" @click="hire">
          {{ hiring ? t('ada.hire_pending') : t('ada.hire') }}
        </f7-button>
        <!-- A clear way out that does not nag: declining here sticks the
             same way dismissing the home card does, so reading the full
             pitch and saying no does not just lead back to being asked
             again on the next load. -->
        <button class="ada__decline" @click="decline">{{ t('ada.decline') }}</button>
      </div>
    </template>
  </f7-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { queries, invalidate } from '@js/queryKeys.js'
import api from '@js/api'
import { formatMoney } from '@js/helpers/money.js'
import { dismissAdaOffer } from '@js/helpers/adaOffer.js'
import { isTrialExhausted, canManageSubscription } from '@js/helpers/adaSubscription.js'
import { openExternal } from '@js/helpers/externalWindow.js'

const { t, locale } = useI18n()
const queryClient = useQueryClient()

// Same query key the home card uses, so this page opens with data already
// in cache rather than a second round trip in the common case of tapping
// through from the card.
const { data } = useQuery(queries.virtualCoach())

const priceLabel = computed(() => {
  const pricing = data.value?.pricing
  if (!pricing) return null
  return formatMoney(pricing.amount_cents, pricing.currency, locale.value)
})

const periodLabel = computed(() => {
  const period = data.value?.pricing?.period
  if (period === 'year') return t('ada.period_year')
  if (period === 'month') return t('ada.period_month')
  // An unknown period from the backend is shown as-is rather than hidden —
  // better a raw word than a price with nothing to divide it by.
  return period ?? ''
})

const hiring = ref(false)
const hireError = ref(null)
// Set only for the one hire() failure that has an actual next step — see
// isTrialExhausted. Distinct from hireError so the template can show the
// subscribe CTA instead of, not alongside, a plain failure message.
const needsSubscription = ref(false)

const decline = () => {
  dismissAdaOffer()
  f7.views.main.router.back()
}

const hire = async () => {
  if (hiring.value) return
  hiring.value = true
  hireError.value = null
  needsSubscription.value = false

  try {
    const result = await api.hireVirtualCoach()
    queryClient.invalidateQueries({ queryKey: invalidate.virtualCoach() })
    // Straight into the conversation, same as openDirectThread elsewhere —
    // hire() always returns a thread_id once it succeeds, but falling back
    // to the list costs nothing if that ever changes.
    f7.views.main.router.navigate(result?.thread_id ? `/messages/${result.thread_id}` : '/messages')
  } catch (e) {
    if (isTrialExhausted(e?.response?.data)) {
      needsSubscription.value = true
    } else {
      hireError.value = t('ada.hire_error')
    }
  } finally {
    hiring.value = false
  }
}

const subscribing = ref(false)
const subscribeError = ref(null)

// Opens Stripe Checkout in a new tab — see externalWindow.js for why a new
// tab rather than navigating the app's own view. Nothing here ever sees a
// card number; the URL is the whole of what this app does with payment.
const subscribe = async () => {
  if (subscribing.value) return
  subscribing.value = true
  subscribeError.value = null

  try {
    const { url } = await api.checkoutVirtualCoach()
    openExternal(url)
  } catch {
    // A silent failure on a payment button reads as the app being broken,
    // not as "nothing happened" — say so.
    subscribeError.value = t('ada.checkout_error')
  } finally {
    subscribing.value = false
  }
}

// Independent of hire/needsSubscription above: this is about whether there
// is a Stripe subscription to manage at all, which can be true whether or
// not this climber currently has Ada (they could have fired her while still
// mid-subscription) — see canManageSubscription's own comment.
const canManage = computed(() => canManageSubscription(data.value?.status))
const managing = ref(false)
const manageError = ref(null)

const manageSubscription = async () => {
  if (managing.value) return
  managing.value = true
  manageError.value = null

  try {
    const { url } = await api.virtualCoachPortal()
    openExternal(url)
  } catch (e) {
    manageError.value = e?.response?.status === 422
      ? t('ada.manage_unavailable')
      : t('ada.manage_error')
  } finally {
    managing.value = false
  }
}
</script>

<style scoped>
.ada__note {
  padding: 1rem;
  color: var(--p-text-dim);
}

.ada__disclosure {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--p-accent-rgb), 0.35);
  background: rgba(var(--p-accent-rgb), 0.07);
  font-weight: 600;
}

.ada__disclosure-icon {
  color: var(--p-accent);
  flex: none;
}

.ada__manage {
  margin: 0 1rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
}

.ada__subscribe {
  margin: 0 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.ada__section {
  margin: 0 1rem 1.2rem;
}

.ada__heading {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted);
}

.ada__list {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.92rem;
}

.ada__pricing p {
  margin: 0 0 0.3rem;
  font-size: 0.92rem;
}

.ada__error {
  margin: 0 1rem 0.6rem;
  color: var(--p-danger, #ef4444);
  font-size: 0.85rem;
}

.ada__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  margin: 0 1rem 1.5rem;
}

.ada__decline {
  border: 0;
  background: none;
  color: var(--p-text-dim);
  font-size: 0.85rem;
  padding: 0.4rem;
}
</style>
