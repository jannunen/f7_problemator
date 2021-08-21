<template>
    <f7-block>
        <f7-block-title>{{ $t('sortby.sort_problems_by') }}</f7-block-title>
        <f7-chip v-for="sort in sorts" :key="sort" :color="getColor(sort)" @click="onChangeSort(sort)" outline :text="$t(`sortby.`+sort)"></f7-chip>
    </f7-block>
</template>
<script>
import { onMounted, ref } from 'vue'
import { useI18n } from "vue-i18n";
export default {
    props : {
        sort : {
            type : String,
            default : 'sector_asc',
        },
    },
    setup(props, context) {
        const { t, d, locale } = useI18n();
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
            'worst'
            ]
        onMounted(() => {
            activeSort.value = props.sort
            if (activeSort.value != props.sort) {
                context.emit('sort-change',activeSort.value)
            }
        })
        const onChangeSort = (newSort) => {
            activeSort.value = newSort
            context.emit('sort-change',newSort)
        }
        const getColor = (sort) => {
            if (activeSort.value == sort) {
                return "red"
            }
            return null
        }
        return {
            onChangeSort,
            sorts,
            getColor,
        }
    }
}
</script>
<style>
</style>