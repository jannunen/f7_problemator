<template>
    <div id="chart" ref="svg"> </div>
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
        default: 600,
        type: Number,
    },
    height: {
        default: 270,
        type: Number,
    },
})
const svg = ref(null)
const g = ref(null)


watch(svg, (newValue) => {

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 30, bottom: 40, left: 50 },
        width = props.width - margin.left - margin.right,
        height = props.height - margin.top - margin.bottom

    // append the svg object to the body of the page

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, d3.max(props.data, (d) => d.available)])
        .range([0, width])

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")



    // Y axis
    var y = d3.scaleBand()
        .range([0, height])
        .domain(props.data.map(function (d) { return d.grade }))
        .padding(.1)
    svg.append("g")
        .attr("class", "ylabel") // class can be used to define the font.
        .call(d3.axisLeft(y))

    //Bars
    svg.selectAll("myRect")
        .data(props.data)
        .enter()
        .append("rect")
        .attr("x", x(0))
        .attr("y", function (d) { return y(d.grade) })
        .attr("width", function (d) { return x(d.available) })
        .attr("height", y.bandwidth())
        .attr("fill", "#69b3a2")

    var bars = svg.selectAll(".bar")
        .data(props.data)
        .enter()
        .append("g")

    //add a value label to the right of each bar
    bars.append("text")
        .attr("class", "label") // class can be used to define the font.
        .attr("y", function (d) {
            return y(d.grade) + 13
        })
        .attr("x", function (d) {
            return x(d.available) + 3
        })
        .text(function (d) {
            return d.available
        })


})
const viewBox = computed(() => {
    return `0 0 ${props.width} ${props.height}`
})
</script>

<style lang="sass">
#chart
  background-color : #323232
  margin: 25px
  &__line
    fill: none
    stroke: #f00
    stroke-width: 1px
.bar 
    fill: #00f
.label
    font-size : 0.8rem
    fill : #fff
.ylabel
    fill : #eee
    color : #ffe

</style>
