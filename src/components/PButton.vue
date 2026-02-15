<template>
  <button class="p-btn" @click="emit('click')"><slot></slot></button>
</template>
<script setup>
    const emit = defineEmits(['click'])
</script>