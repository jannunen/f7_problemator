<template>
  <div >
    <BarChart  ref="lastAscents" style="position: relative; height:14vh;20vw; " v-bind="barChartProps" />
  </div>
</template>

<script >
import { computed, ref } from "vue";
import { BarChart, useBarChart } from "vue-chart-3";
import { Chart, registerables } from "chart.js";
import { useI18n } from "vue-i18n";

Chart.register(...registerables);

export default {
  props: {
    type: {
      type: String,
      default: "boulder",
    },
    ascents: {
      type: Map,
      default: [],
    },
    grades: {
      type: Array,
      default: [],
    },
  },
  components: { BarChart },
  watch : {
    ascents(newValue) {
      // Reload chart
      this.$refs.lastAscents.update()
    },

  },
  setup(props) {
    const { t } = useI18n();
    const ascents = Array.from(props.ascents.values());
    const grades = props.grades;
    const labels = Array.from(props.ascents.keys()).map(
      (gradeId) => grades.find((grade) => grade.id == gradeId).name
    );

    const testData = computed(() => ({
      labels,
      datasets: [
        {
          data: ascents,
          label: t("amount"),
          backgroundColor: ["#97B0C4"],
        },
      ],
    }));

    const options = computed(() => ({
      maintainAspectRatio: false,
      scales: {
        y: {
            ticks : {
                stepSize : 1
            }
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    }));

    const { barChartProps, barChartRef } = useBarChart({
      chartData: testData,
      options,
    });

    return {
      testData,
      options,
      barChartRef,
      barChartProps,
      t,
    };
  },
};
</script>

<style></style>

