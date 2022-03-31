<template >
  <div v-if="grades != null && grades.length > 0">
    {{ $t('gradefilter.minimum_grade') }} <span>{{ getGradeName(gradeMin) }}</span>
          <f7-range
            :min="0"
            :max="getGradeMax"
            :step="1"
            :value="gradeMin"
            :label="false"
            :dual="false"
            color="green"
            @range:change="onMinGradeChange"
          />
        
    <h4 class="display-flex justify-content-space-between"
      >{{ $t('gradefilter.maximum_grade') }}
      <span>{{ getGradeName(gradeMax) }}</span></h4 >
          <f7-range
            :min="0"
            :max="getGradeMax"
            :step="1"
            :value="gradeMax"
            :label="false"
            :dual="false"
            color="green"
            @range:change="onMaxGradeChange"
          />
        
      
    
  </div>
</template>
<script>
import { computed, onMounted, ref } from "vue";
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

        getGradeName,
        getGradeMax,
    }
  },
  components : {

  }
};
</script>
<style >
</style>