<template >
  <div v-if="grades != null && grades.length > 0">
    <f7-block-title class="display-flex justify-content-space-between"
      >{{ $t('Grade filter ') }}
      <span>{{ getGradeName(gradeMin) }} - {{ getGradeName(gradeMax) }}</span></f7-block-title
    >
    
      
          <f7-range
            :min="0"
            :max="getMaxGrade"
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
    const getMaxGrade = computed(() => {
        return props.grades.length -1
    })
    const getGradeName = (grade) => {
       if (props.grades== null) {
           return null
       } 
       const aGrade = props.grades[grade]
       if (aGrade != null) {
        return aGrade.name
        }

    }
    onMounted(() => {
        if (props.min == 'min') {
            gradeMin.value = 0
        }
        if (props.max == 'max') {
            gradeMax.value =prps.grades.length-1 
        } else {
            gradeMax.value = props.max
        }
        if (props.min == 'na') {
            gradeMin.value = 0
        }
        if (props.max == 'na') {
            gradeMax.value =props.grades.length -1 
        }

    });
    return {
        gradeMin,
        gradeMax,
        onGradeChange,
        getMaxGrade,
        getGradeName,
    }
  },
};
</script>
<style >
</style>