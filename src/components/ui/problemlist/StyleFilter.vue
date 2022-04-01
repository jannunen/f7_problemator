<template>
  <div>
    <f7-chip
      outline
      :color="getColor(style)"
      @click="(evt) => onClicked(style, evt)"
      v-for="style in styles"
      :key="style"
      :text="t(style)"
    ></f7-chip>
    <f7-chip v-if="selectedStyles.length > 0" @click="clearStyles" color="red">{{
      t('stylefilter.reset_filter')
    }}</f7-chip>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue'
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
    const { t, d, locale } = useI18n();
    const onClicked = (style, chip) => {
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
    const getColor = (style) => {
      if (props.selectedStyles.includes(style)) {
        return 'red'
      }
      return null
    }
    return {
      onClicked,
      clearStyles,
      getColor,
      t,
    }
  },
  components: {},
}
</script>
<style></style>
