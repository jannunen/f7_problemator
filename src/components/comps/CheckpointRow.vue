<template>
  <div class="flex flex-col w-full">
    <div class="flex flex-row flex-wrap gap-1">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        :disabled="disabled"
        class="px-2 py-1 rounded-md text-sm font-bold text-white disabled:opacity-50"
        :class="chipClass(opt)"
        :data-test="'chip-' + opt.value"
        @click="emit('select', opt.value)"
      >
        {{ label(opt) }} ({{ opt.points }})
      </button>
    </div>
    <div class="flex flex-row items-center mt-1 text-sm">
      <span v-if="hasTop" class="font-bold text-green-600">{{ t('comps.topped') }}</span>
      <span v-else-if="myCheckpoint" class="font-bold text-indigo-600">{{ t('comps.checkpoint_reached', { n: myCheckpoint }) }}</span>
      <span v-else class="text-gray-500">{{ t('comps.no_checkpoint_yet') }}</span>
      <button
        v-if="myCheckpoint && !hasTop"
        type="button"
        :disabled="disabled"
        class="ml-2 underline text-red-500 disabled:opacity-50"
        data-test="clear"
        @click="emit('clear')"
      >
        {{ t('comps.clear_checkpoint') }}
      </button>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { checkpointOptions } from '@helpers/checkpoints.js'

const props = defineProps({
  problem: Object,
  myCheckpoint: { type: Number, default: null },
  hasTop: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'clear'])
const { t } = useI18n()

const options = computed(() => checkpointOptions(props.problem))
const label = (opt) => (opt.value === 'top' ? t('comps.top') : t('comps.checkpoint_n', { n: opt.value }))
// A top tick wins over any checkpoint, so only Top is highlighted when topped.
const isReached = (opt) => {
  if (props.hasTop) return opt.value === 'top'
  return opt.value !== 'top' && props.myCheckpoint != null && opt.value <= props.myCheckpoint
}
const chipClass = (opt) => {
  if (isReached(opt)) return opt.value === 'top' ? 'bg-green-600' : 'bg-indigo-600'
  return 'bg-gray-400 dark:bg-gray-600'
}
</script>
