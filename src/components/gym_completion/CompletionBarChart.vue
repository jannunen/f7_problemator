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
    var margin = { top: 10, right: 30, bottom: 20, left: 50 },
        width = 460 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom

    // append the svg object to the body of the page
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")

    const data = props.data
    const subgroups = [ 'done','available']
    // List of groups = species here = value of the first column called group -> I show them on the X axis
    var groups = d3.map(data, function (d) { return (d.group) })


     // Add X axis
  const x = d3.scaleBand()
      .domain(groups)
      .range([0, width])
      .padding([0.2])
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, 60])
    .range([ height, 0 ]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // color palette = one color per subgroup
  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#e41a1c','#377eb8','#4daf4a'])

  //stack the data? --> stack per subgroup
  const stackedData = d3.stack()
    .keys(subgroups)
    (data)

  // Show the bars
  svg.append("g")
    .selectAll("g")
    // Enter in the stack data = loop key per key = group per group
    .data(stackedData)
    .join("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      // enter a second time = loop subgroup per subgroup to add all rectangles
      .data(d => d)
      .join("rect")
        .attr("x", d => x(d.data.group))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width",x.bandwidth())


})
const viewBox = computed(() => {
    return `0 0 ${props.width} ${props.height}`
})
</script>

<style lang="sass">

</style>
