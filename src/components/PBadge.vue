<template>
  <span class="py-1 px-2 text-sm mx-1 my-1 rounded-lg" ><slot></slot> </span>
</template>
<script setup>
    const emit = defineEmits(['click'])
</script>