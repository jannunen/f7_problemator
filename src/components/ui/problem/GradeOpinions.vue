<template>
  <div style="">
    <BarChart style="height : 200px;" v-bind="barChartProps" />
  </div>
</template>

<script >
import { computed, ref } from "vue";
import { BarChart, useBarChart } from "vue-chart-3";
import { Chart,   registerables } from "chart.js";
import { useI18n } from "vue-i18n";

Chart.register(...registerables);

export default {
    props : {
        grades : {
            type : Array,
            default : [],
        },
        opinions : {
            type : Object,
            default : []
        }
    },
  name: "App",
  components: { BarChart },
  setup(props) {
    const toggleLegend = ref(true);
    const { t, d, locale } = useI18n();

    const testData = computed(() => ({
      labels: props.grades.map(item => item.name),
      datasets: [
        {
          data: props.opinions.map(opinion => opinion.count),
          label : t('amount'),
          backgroundColor: [ "#97B0C4" ],
        },
      ],
    }));

    const options = computed(() => ({
         responsive: true,
        maintainAspectRatio: false,
        height: 200,
        plugins : {
            legend : {
                display : false,
            }
        }

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
    };
  },
};
</script>

<style></style>

