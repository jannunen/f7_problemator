<template>
    <div ref="chartContainer" class="completion-chart-container">
        <div id="chart" ref="svg"></div>
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
        default: 600,
        type: Number,
    },
    height: {
        default: 270,
        type: Number,
    },
})
const svg = ref(null)
const chartContainer = ref(null)

const COLORS = {
    done: '#34C759',
    available: '#D1D5DB',
}

const LABELS = {
    done: 'Ticked',
    available: 'Remaining',
}

watch(svg, (newValue) => {
    if (!newValue) return
    drawChart()
})

function drawChart() {
    // Clear any previous chart
    d3.select("#chart").selectAll("*").remove()

    const containerWidth = chartContainer.value?.offsetWidth || props.width
    const margin = { top: 24, right: 16, bottom: 40, left: 38 }
    const width = Math.min(containerWidth - margin.left - margin.right, 520)
    const height = 320 - margin.top - margin.bottom

    const root = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 48)
        .attr("class", "completion-svg")

    const chart = root
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

    const data = props.data
    if (!data || data.length === 0) return

    const subgroups = ['done', 'available']
    const groups = data.map(d => d.group)

    // X axis
    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding(0.3)

    // Y axis
    const yMax = d3.max(data, d => d.available + d.done) || 1
    const y = d3.scaleLinear()
        .domain([0, yMax + Math.ceil(yMax * 0.1)])
        .nice()
        .range([height, 0])

    // Grid lines
    chart.append("g")
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(y.ticks(5))
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3")

    // X axis
    const xAxis = chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSizeOuter(0).tickSize(0))

    xAxis.select(".domain").attr("stroke", "#D1D5DB")
    xAxis.selectAll("text")
        .attr("dy", "0.9em")
        .style("font-size", "11px")
        .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
        .style("fill", "#6B7280")

    // Y axis
    const yAxis = chart.append("g")
        .call(d3.axisLeft(y).ticks(5).tickSize(0).tickFormat(d3.format("d")))

    yAxis.select(".domain").remove()
    yAxis.selectAll("text")
        .style("font-size", "11px")
        .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
        .style("fill", "#9CA3AF")

    // Color scale
    const color = d3.scaleOrdinal()
        .domain(subgroups)
        .range([COLORS.done, COLORS.available])

    // Stacked data
    const stackedData = d3.stack()
        .keys(subgroups)
        (data)

    const barRadius = 3

    // Draw bars
    chart.append("g")
        .selectAll("g")
        .data(stackedData)
        .join("g")
        .attr("fill", d => color(d.key))
        .each(function(parentData) {
            const isTopLayer = parentData.key === 'available'
            d3.select(this)
                .selectAll("rect")
                .data(d => d)
                .join(enter => {
                    if (isTopLayer) {
                        // Top segment gets rounded top corners
                        return enter.append("path")
                            .attr("d", d => {
                                const xPos = x(d.data.group)
                                const yTop = y(d[1])
                                const yBot = y(d[0])
                                const w = x.bandwidth()
                                const h = yBot - yTop
                                if (h <= 0) return ''
                                const r = Math.min(barRadius, h / 2, w / 2)
                                return `M${xPos},${yBot}
                                        V${yTop + r}
                                        Q${xPos},${yTop} ${xPos + r},${yTop}
                                        H${xPos + w - r}
                                        Q${xPos + w},${yTop} ${xPos + w},${yTop + r}
                                        V${yBot}Z`
                            })
                    } else {
                        // Bottom segment is a plain rect
                        return enter.append("rect")
                            .attr("x", d => x(d.data.group))
                            .attr("y", d => y(d[1]))
                            .attr("height", d => Math.max(0, y(d[0]) - y(d[1])))
                            .attr("width", x.bandwidth())
                    }
                })
        })

    // Count labels on top of each bar
    chart.append("g")
        .selectAll("text")
        .data(data)
        .join("text")
        .attr("x", d => x(d.group) + x.bandwidth() / 2)
        .attr("y", d => y(d.done + d.available) - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
        .style("fill", "#9CA3AF")
        .style("font-weight", "500")
        .text(d => d.done + d.available)

    // Legend
    const legendData = [
        { key: 'done', label: LABELS.done, color: COLORS.done },
        { key: 'available', label: LABELS.available, color: COLORS.available },
    ]

    const legend = root.append("g")
        .attr("transform", `translate(${margin.left}, ${height + margin.top + margin.bottom + 12})`)

    const legendItems = legend.selectAll("g")
        .data(legendData)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * 120}, 0)`)

    legendItems.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", d => d.color)

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 11)
        .style("font-size", "12px")
        .style("font-family", "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif")
        .style("fill", "#4B5563")
        .style("font-weight", "500")
        .text(d => d.label)
}
</script>

<style lang="sass">
.completion-chart-container
    width: 100%

.completion-svg
    display: block
</style>
