<template>
  <!-- should_offer is the backend's call (no coach at all, enough tick
       history for Ada's opening move to work) — never re-derived here. A
       local dismissal only ever narrows that further, it does not widen it.
       See shouldShowAdaCard in helpers/adaOffer.js. -->
  <div v-if="show" class="acard-wrap">
    <button class="acard" @click="openExplainer">
      <span class="acard__icon">
        <span class="material-icons">smart_toy</span>
      </span>
      <span class="acard__body">
        <span class="acard__title">{{ t('ada.card_title') }}</span>
        <span class="acard__sub">{{ t('ada.card_body') }}</span>
      </span>
      <span class="material-icons acard__go">chevron_right</span>
    </button>
    <!-- Its own tap target, not part of the button above — a dismissal is a
         different action than "tell me more" and must not fire both. -->
    <button
      class="acard__dismiss"
      :aria-label="t('ada.card_dismiss')"
      @click.stop="dismiss"
    >
      <span class="material-icons">close</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { f7 } from 'framework7-vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { queries } from '@js/queryKeys.js'
import { isAdaOfferDismissed, dismissAdaOffer, shouldShowAdaCard } from '@js/helpers/adaOffer.js'

const { t } = useI18n()

const { data } = useQuery({
  ...queries.virtualCoach(),
  // placeholderData, not initialData — see queryKeys.js's gyms() for why:
  // initialData is cached as the answer itself, so with should_offer
  // defaulted to false here the card would never appear once the real
  // response says otherwise it just never runs again. This is only what to
  // render while the real answer is in flight.
  placeholderData: { should_offer: false },
})

// Read once per mount, not reactively: a dismissal happens locally (see
// dismiss() below) and nothing outside this component changes it, so there
// is nothing to watch for.
const dismissed = ref(isAdaOfferDismissed())

const show = computed(() => shouldShowAdaCard(data.value?.should_offer, dismissed.value))

const openExplainer = () => f7.views.main.router.navigate('/coach/ada')

const dismiss = () => {
  dismissAdaOffer()
  dismissed.value = true
}
</script>

<style scoped>
.acard-wrap {
  position: relative;
  margin-bottom: 0.6rem;
}

.acard {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 2.4rem 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(var(--p-accent-rgb), 0.35);
  background: rgba(var(--p-accent-rgb), 0.07);
  color: var(--p-text);
  text-align: left;
}

.acard__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
}

.acard__icon .material-icons {
  font-size: 1.4rem;
  color: var(--p-accent);
}

.acard__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.acard__title {
  font-size: 0.95rem;
  font-weight: 600;
}

.acard__sub {
  font-size: 0.78rem;
  color: var(--p-text-dim);
}

.acard__go {
  font-size: 1.2rem;
  color: var(--p-text-dark);
}

.acard__dismiss {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--p-text-dim);
}

.acard__dismiss .material-icons {
  font-size: 1.1rem;
}
</style>
