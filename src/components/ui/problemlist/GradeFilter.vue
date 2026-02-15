<template >
  <div v-if="grades != null && grades.length > 0" class="grade-filter">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm" style="color: var(--p-text-muted);">{{ t('gradefilter.minimum_grade') }}</span>
      <span class="text-sm font-semibold" style="color: var(--p-accent);">{{ getGradeName(gradeMin) }}</span>
    </div>
    <f7-range
      :min="0"
      :max="getGradeMax"
      :step="1"
      :value="gradeMin"
      :label="false"
      :dual="false"
      @range:change="onMinGradeChange"
    />

    <div class="flex items-center justify-between mb-2 mt-4">
      <span class="text-sm" style="color: var(--p-text-muted);">{{ t('gradefilter.maximum_grade') }}</span>
      <span class="text-sm font-semibold" style="color: var(--p-accent);">{{ getGradeName(gradeMax) }}</span>
    </div>
    <f7-range
      :min="0"
      :max="getGradeMax"
      :step="1"
      :value="gradeMax"
      :label="false"
      :dual="false"
      @range:change="onMaxGradeChange"
    />
  </div>
</template>
<script>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
export default {
  props: {
      grades : {
          type : Array,
          default : []
      },
    min: {
      type: null,
      default: 'min',
    },
    max: {
      type: null,
      default: 'max',
    },
  },
  emits: ["min","max"],
  setup(props, context) {
    const { t } = useI18n();
    const onMinGradeChange = (value) => {
       context.emit('min',props.grades[value])
    }
    const onMaxGradeChange = (value) => {
       context.emit('max',props.grades[value])
    }
    const getGradeName = (grade) => {
       if (props.grades== null) {
           return null
       }
       const aGrade = props.grades[grade]
       if (aGrade != null) {
        return aGrade.name
        }
    }
    const getGradeMax = computed(() => {
        return  props.grades.length -1
    })
    const gradeMin = computed(() => {
        let min = props.min
        if (typeof(props.min)=="object") {
          // Find array index in grades
          min = props.grades.findIndex((item) => item.id == props.min.id)
        }
        if (props.min == 'min') {
            min= 0
        }
        // Reset to min if invalid
        if (min == null || isNaN(min)) {
            min= 0
        }
        return min

    })
    const gradeMax = computed(() => {
      let max = props.max
        if (typeof(props.max)=="object") {
          // Find array index in grades
          max = props.grades.findIndex((item) => item.id == props.max.id)
        }
        if (max == 'max') {
            max = props.grades.length -1
        }
        // Reset to max if invalid
        if (max == null || isNaN(max)) {
            max = props.grades.length -1
        }
        return max

    })
    onMounted(() => {

    });
    return {
        gradeMin,
        gradeMax,
        onMinGradeChange,
        onMaxGradeChange,
        t,
        getGradeName,
        getGradeMax,
    }
  },
  components : {

  }
};
</script>
<style scoped>
.grade-filter :deep(.range-slider) {
  --f7-range-bar-bg-color: rgba(255, 255, 255, 0.1);
  --f7-range-bar-active-bg-color: #38bdf8;
  --f7-range-knob-color: #38bdf8;
  --f7-range-knob-size: 24px;
}
</style>
