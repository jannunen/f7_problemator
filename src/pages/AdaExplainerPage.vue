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

      <div class="ada__actions">
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

const decline = () => {
  dismissAdaOffer()
  f7.views.main.router.back()
}

const hire = async () => {
  if (hiring.value) return
  hiring.value = true
  hireError.value = null

  try {
    const result = await api.hireVirtualCoach()
    queryClient.invalidateQueries({ queryKey: invalidate.virtualCoach() })
    // Straight into the conversation, same as openDirectThread elsewhere —
    // hire() always returns a thread_id once it succeeds, but falling back
    // to the list costs nothing if that ever changes.
    f7.views.main.router.navigate(result?.thread_id ? `/messages/${result.thread_id}` : '/messages')
  } catch (e) {
    hireError.value = e?.response?.data?.needs_subscription
      ? t('ada.trial_used_error')
      : t('ada.hire_error')
  } finally {
    hiring.value = false
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
