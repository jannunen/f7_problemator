<script setup>
import { computed } from 'vue'

const props = defineProps({
  'variant' : {type : String, default : 'info'}
})


const getClasses = computed(() => {
  const classList = "p-4 mb-4 text-sm rounded-lg ".split(" ")
  switch (props.variant) {
    case 'danger':
      return [...classList, 'text-red-800 bg-red-100 dark:bg-gray-800 dark:text-red-400'.split(" ")]
    case 'info':
      return [...classList, 'text-blue-800 bg-blue-100 dark:bg-gray-800 dark:text-blue-400'.split(" ")]
    case 'warning':
      return [...classList, 'text-orange-800 bg-orange-100 dark:bg-gray-800 dark:text-orange-400'.split(" ")]
    case 'success':
      return [...classList, 'text-green-800 bg-green-100 dark:bg-gray-800 dark:text-green-400'.split(" ")]
  }
})
   
</script>
<template>
  <div :class="getClasses" role="alert">
    <slot><span class="font-medium">Danger alert!</span> This is default content</slot>
  </div>
</template>
