<template>
  <div v-if="failed" class="boundary">
    <div class="boundary__card">
      <h2 class="boundary__title">{{ t('errors.screen_failed_title') }}</h2>
      <p class="boundary__body">{{ t('errors.screen_failed_body') }}</p>

      <!-- Shown always. A climber who can read the message back can be helped;
           one who only has "it broke" cannot. -->
      <pre class="boundary__detail">{{ state.message }}</pre>

      <div class="boundary__actions">
        <button v-if="state.canRetry" class="button button-fill" @click="retry">
          {{ t('errors.try_again') }}
        </button>
        <button class="button" @click="goHome">{{ t('errors.go_home') }}</button>
      </div>

      <p v-if="!state.canRetry" class="boundary__note">{{ t('errors.screen_is_broken') }}</p>
    </div>
  </div>

  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { f7 } from 'framework7-vue'
import { nextBoundaryState, afterRetry } from '@helpers/errorBoundary'

/**
 * Stops one broken page from taking the app down.
 *
 * A throw during render aborts Vue's render effect for that subtree and leaves
 * it half-patched. On a phone that reads as a frozen app with no way out but
 * force-quitting — there is no address bar to reload from. Returning false
 * from onErrorCaptured keeps the error here instead of letting it reach the
 * Framework7 shell.
 *
 * The error is logged in full and its message shown: a boundary that hides
 * bugs buys a working-looking app at the price of never hearing what broke.
 */
const { t } = useI18n()

const failed = ref(false)
const state = ref({ message: '', canRetry: true, retries: 0, signature: null })

const currentRoute = () => f7?.views?.main?.router?.currentRoute?.path || ''

onErrorCaptured((error, instance, info) => {
  console.error(
    `[boundary] ${currentRoute()} failed during ${info}`,
    { error, component: instance?.$options?.__name || instance?.$?.type?.__name },
  )

  state.value = nextBoundaryState(error, currentRoute(), state.value)
  failed.value = true
  return false
})

const retry = () => {
  state.value = afterRetry(state.value)
  failed.value = false
  // Re-enter the same route so the page actually re-runs rather than the panel
  // simply being hidden over a subtree that never re-rendered.
  const path = currentRoute()
  if (path) f7.views.main.router.navigate(path, { reloadCurrent: true })
}

const goHome = () => {
  failed.value = false
  f7.views.main.router.navigate('/', { reloadAll: true })
}
</script>

<style scoped>
.boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 1rem;
}

.boundary__card {
  width: 100%;
  max-width: 32rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--f7-block-strong-border-color, rgb(255 255 255 / 12%));
  background: var(--f7-block-strong-bg-color, rgb(255 255 255 / 4%));
}

.boundary__title { margin: 0 0 0.5rem; font-size: 1.125rem; }
.boundary__body { margin: 0 0 0.75rem; opacity: 0.85; }

.boundary__detail {
  margin: 0 0 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: rgb(0 0 0 / 20%);
  font-size: 0.8125rem;
  white-space: pre-wrap;
  overflow-x: auto;
  opacity: 0.8;
}

.boundary__actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.boundary__note { margin: 0.75rem 0 0; font-size: 0.8125rem; opacity: 0.7; }
</style>
