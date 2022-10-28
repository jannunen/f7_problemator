<template>
    <div id="chart" 
    ref="svg"
    style="width : 400px; height : 300px;"
    
    :viewBox="viewBox"
        >
  </div>
</template>
<script setup>
import * as d3 from 'd3'
import { watch, onMounted, computed, ref } from 'vue'
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
    },
})
const svg = ref(null)
const g = ref(null)

const padding = ref(6)

const rangeX = computed(() => {
    const width = props.width - padding.value
    return [0, width]
})
const rangeY = computed(() => {
    const height = props.height
    return [0, height]
})
watch(svg, (newValue) => {

// set the dimensions and margins of the graph
var margin = {top: 20, right: 30, bottom: 40, left: 90},
    width = 460 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page

  // Add X axis
  var x = d3.scaleLinear()
    .domain([0, d3.max(props.data,(d) => d.available)])
    .range([ 0, props.width]);

    const svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.left + margin.right)
  .append("g")


  // Y axis
  var y = d3.scaleBand()
    .range([ 0, height])
    .domain(props.data.map(function(d) { return d.grade; }))
    .padding(.1);
  svg.append("g")
    .call(d3.axisLeft(y))

  //Bars
  svg.selectAll("myRect")
    .data(props.data)
    .enter()
    .append("rect")
    .attr("x", x(0) )
    .attr("y", function(d) { return y(d.grade); })
    .attr("width", function(d) { return x(d.available); })
    .attr("height", y.bandwidth() )
    .attr("fill", "#69b3a2")


})
const viewBox = computed(() => {
    return `0 0 ${props.width} ${props.height}`
})
</script>

<style lang="sass">
.line-chart
  background-color : #c0c0c0
  margin: 25px
  &__line
    fill: none
    stroke: #f00
    stroke-width: 1px
.bar 
    fill: #00f
</style>
