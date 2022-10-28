<template>
     <svg
    class="line-chart"
    :viewBox="viewBox"
  >
    <g transform="translate(0, 10)">
      <path
        class="line-chart__line"
        :d="line"
      />
    </g>
  </svg>
</template>
<script setup>
import * as d3 from 'd3'
import { computed, ref } from 'vue'
const props = defineProps({
    data: {
        required: true,
        type: Array,
    },
    width: {
        default: 500,
        type: Number,
    },
    height: {
        default: 270,
        type: Number,
    }
})

const padding = ref(6)

const rangeX = computed(() => {
    const width = props.width - padding.value
    return [0, width]
})
const rangeY = computed(() => {
    const height = props.height 
    return [0, height]
})
const path = computed(() => {
    const x = d3.scaleLinear().range(rangeX.value)
    const y = d3.scaleLinear().range(rangeY.value)
    d3.axisLeft().scale(x)
    d3.axisTop().scale(y)
    x.domain(d3.extent(props.data, (d, i) => i))
    y.domain([0, d3.max(props.data, d => d.available)])
    return d3.line()
        .x((d, i) => x(i))
        .y(d => y(d.available))
})
const line = computed(() => {
    return path.value(props.data)
})
const viewBox = computed(() => {
    return `0 0 ${props.width} ${props.height}`
})
</script>

<style lang="sass">
.line-chart
  margin: 25px
  &__line
    fill: none
    stroke: #76BF8A
    stroke-width: 3px
</style>
