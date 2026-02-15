<template>
  <div class="flex flex-start overflow-x-scroll flex-wrap gap-1 py-1">
    <span
      v-for="sort in sorts"
      :key="sort"
      class="p-chip"
      :class="{ 'p-chip--active': sort == activeSort }"
      @click="onChangeSort(sort)"
    >{{ t(`sortby.` + sort) }}</span>
  </div>
</template>
<script>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
export default {
  props: {
    sort: {
      type: String,
      default: 'sector_asc',
    },
  },
  setup(props, context) {
    const { t } = useI18n()
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
    return {
      onChangeSort,
      activeSort,
      t,
      sorts,
    }
  },
  components: {},
}
</script>
