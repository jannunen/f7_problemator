<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="style in styles"
      :key="style"
      class="p-chip"
      :class="{ 'p-chip--active': selectedStyles.includes(style) }"
      @click="onClicked(style)"
    >{{ t(style) }}</span>
    <span v-if="selectedStyles.length > 0" class="p-chip p-chip--danger" @click="clearStyles">
      {{ t('stylefilter.reset_filter') }}
    </span>
  </div>
</template>
<script>
import { ref } from 'vue'
import { useI18n } from "vue-i18n";

export default {
  props: {
    selectedStyles: {
      type: Array,
      default: [],
    },
    styles: {
      type: Array,
      default: [],
    },
  },
  emits: ['styles-changed'],
  setup(props, context) {
    const { t } = useI18n();
    const onClicked = (style) => {
      let newStyles = null
      // Toggle style
      if (props.selectedStyles.includes(style)) {
        //remove
        newStyles = props.selectedStyles.filter((item) => item != style)
      } else {
        // add
        newStyles = [...props.selectedStyles, style]
      }
      context.emit('styles-changed', newStyles)
    }
    const clearStyles = () => {
      context.emit('styles-changed', [])
    }
    return {
      onClicked,
      clearStyles,
      t,
    }
  },
  components: {},
}
</script>
