<template>
  <div class="flex flex-start overflow-x-scroll	h-10">
    <chip
      :togglable="false"
      v-for="sort in sorts"
      :key="sort"
      :checked="sort == activeSort"
      @click="onChangeSort(sort)"
      :text="t(`sortby.` + sort)"
    ></chip>
  </div>
</template>
<script>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Chip from '@components/ui/Chip.vue'
export default {
  props: {
    sort: {
      type: String,
      default: 'sector_asc',
    },
  },
  setup(props, context) {
    const { t, d, locale } = useI18n()
    const activeSort = ref(null)
    const sorts = ref([])
    sorts.value = [
      'sector_asc',
      'sector_desc',
      'newest',
      'oldest',
      'routesetter_asc',
      'routesetter_desc',
      'hardest',
      'easiest',
      'most_ticks',
      'least_ticks',
      'best',
      'worst',
    ]
    onMounted(() => {
      activeSort.value = props.sort
      if (activeSort.value != props.sort) {
        context.emit('sort-change', activeSort.value)
      }
    })
    const onChangeSort = (newSort) => {
      activeSort.value = newSort
      context.emit('sort-change', newSort)
    }
    const getColor = (sort) => {
      if (activeSort.value == sort) {
        return 'red'
      }
      return null
    }
    return {
      onChangeSort,
      activeSort,
      t,
      sorts,
      getColor,
    }
  },
  components: {
    Chip,
  },
}
</script>
<style></style>
