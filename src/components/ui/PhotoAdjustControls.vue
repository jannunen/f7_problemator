<template>
  <div class="photo-adjust">
    <button class="photo-adjust__toggle" @click="open = !open">
      <span class="material-icons">tune</span>
      {{ t('spraywall.adjust_photo') }}
      <span v-if="!matchesGym || hasMine" class="photo-adjust__badge">•</span>
    </button>

    <div v-if="open" class="photo-adjust__panel">
      <label class="photo-adjust__row">
        <span class="photo-adjust__name">{{ t('spraywall.grayscale') }}</span>
        <input type="range" min="0" max="100" step="5" v-model.number="grayscale" />
        <span class="photo-adjust__value">{{ grayscale }}%</span>
      </label>
      <label class="photo-adjust__row">
        <span class="photo-adjust__name">{{ t('spraywall.contrast') }}</span>
        <input type="range" min="50" max="200" step="5" v-model.number="contrast" />
        <span class="photo-adjust__value">{{ contrast }}%</span>
      </label>
      <label class="photo-adjust__row">
        <span class="photo-adjust__name">{{ t('spraywall.brightness') }}</span>
        <input type="range" min="50" max="200" step="5" v-model.number="brightness" />
        <span class="photo-adjust__value">{{ brightness }}%</span>
      </label>
      <div class="photo-adjust__actions">
        <button class="photo-adjust__action" :disabled="matchesGym && !hasMine" @click="onReset">
          {{ t('spraywall.use_gym_setting') }}
        </button>
        <button class="photo-adjust__action photo-adjust__action--save" @click="onSave">
          {{ saved ? t('spraywall.saved') : t('spraywall.save_mine') }}
        </button>
      </div>
      <p class="photo-adjust__note">{{ t('spraywall.adjust_note') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePhotoAdjust } from '@js/usePhotoAdjust'

const { t } = useI18n()
const { grayscale, contrast, brightness, matchesGym, hasMine, saveMine, resetToGym } = usePhotoAdjust()

const saved = ref(false)

const onSave = () => {
  saveMine()
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}

const onReset = () => {
  resetToGym()
  saved.value = false
}

// Collapsed by default: most climbers never touch this, and three sliders
// permanently above the wall cost screen space that the wall needs more.
const open = ref(false)
</script>

<style scoped>
.photo-adjust {
  padding: 0 1rem;
}

.photo-adjust__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 0.75rem;
  color: var(--p-accent);
}

.photo-adjust__toggle .material-icons {
  font-size: 16px;
}

.photo-adjust__badge {
  font-size: 1rem;
  line-height: 0;
}

.photo-adjust__panel {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  margin-top: 4px;
}

.photo-adjust__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 0.75rem;
}

.photo-adjust__name {
  width: 5.5em;
  opacity: 0.75;
}

.photo-adjust__row input[type='range'] {
  flex: 1;
  min-width: 0;
}

.photo-adjust__value {
  width: 3em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.photo-adjust__actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.photo-adjust__action {
  background: none;
  border: none;
  padding: 2px 0;
  font-size: 0.7rem;
  text-decoration: underline;
  color: inherit;
  opacity: 0.75;
}

.photo-adjust__action--save {
  color: var(--p-accent);
  opacity: 1;
}

.photo-adjust__action:disabled {
  opacity: 0.3;
  text-decoration: none;
}

.photo-adjust__note {
  font-size: 0.65rem;
  opacity: 0.5;
  margin: 4px 0 0;
}
</style>
