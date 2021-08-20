<template >
  <div v-if="grades != null && grades.length > 0">
    <f7-block-title class="display-flex justify-content-space-between"
      >{{ $t('Grade filter ') }}
      <span>{{ getGradeName(gradeMin) }} - {{ getGradeName(gradeMax) }}</span></f7-block-title
    >
          <f7-range
            :min="0"
            :max="getGradeMax"
            :step="1"
            :value="[gradeMin, gradeMax]"
            :label="false"
            :dual="true"
            color="green"
            @range:change="onGradeChange"
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
    const onGradeChange = (values) => {
       gradeMin.value = values[0];
       gradeMax.value= values[1];
       context.emit('min',props.grades[gradeMin.value])
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
        if (isNaN(gradeMax.value)) {
            const newValue =  props.grades.length -1 
            gradeMax.value = newValue
            return gradeMax.value
        }
        return gradeMax.value
    })
    onMounted(() => {
        if (props.min == 'min') {
            gradeMin.value = 0
        }
        if (gradeMin.value == 'na') {
            gradeMin.value = 0
        }
        if (props.max == 'max') {
            gradeMax.value =prps.grades.length-1 
        } else {
            gradeMax.value = props.max
        }

    });
    return {
        gradeMin,
        gradeMax,
        onGradeChange,
        getGradeName,
        getGradeMax,
    }
  },
};
</script>
<style >
</style>