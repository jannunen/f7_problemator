<template>
  <button class="rounded-sm  py-2 px-4 dark:text-white" @click="emit('click')"><slot></slot> </button>
</template>
<script setup>
    const emit = defineEmits(['click'])
</script>