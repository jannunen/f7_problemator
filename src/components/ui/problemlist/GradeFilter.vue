<template >
  <div v-if="grades != null && grades.length > 0">
    <f7-block-title class="display-flex justify-content-space-between"
      >{{ $t('gradefilter.minimum_grade') }} <span>{{ getGradeName(gradeMin) }}</span></f7-block-title
    >
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
        
    <f7-block-title class="display-flex justify-content-space-between"
      >{{ $t('gradefilter.maximum_grade') }}
      <span>{{ getGradeName(gradeMax) }}</span></f7-block-title
    >
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
import { useStore } from "framework7-vue";
import store from "@js/store";
export default {
  props: {
      grades : {
          type : Array,
          default : []
      },
    min: {
      type: String,
      default: 'na',
    },
    max: {
      type: String,
      default: 'na',
    },
  },
  emits: ["min","max"],
  setup(props, context) {
    const gradeMin = ref(0)
    const gradeMax = ref(props.grades.length -1)
    const onMinGradeChange = (value) => {
       gradeMin.value = value
       context.emit('min',props.grades[gradeMin.value])
    }
    const onMaxGradeChange = (value) => {
       gradeMax.value= value
       context.emit('max',props.grades[gradeMax.value])
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
    onMounted(() => {
        if (props.min == 'min') {
            gradeMin.value = 0
        }
        if (props.max == 'max') {
            gradeMax.value =props.grades.length -1
        } else {
            gradeMax.value = props.max
        }
        if (gradeMax.value == null || isNaN(gradeMax.value)) {
            gradeMax.value = props.grades.length -1
        }
        if (gradeMin.value == null || isNaN(gradeMin.value)) {
            gradeMin.value = 0
        }

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
};
</script>
<style >
</style>