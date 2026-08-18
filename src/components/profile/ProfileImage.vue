<template>
  <div
    class="mx-auto w-36 h-36 border-2 border-white rounded-full bg-black overflow-hidden relative -top-20 bg-black"
  >
    <img v-if="src != null" :src="src" alt="Profile image" />
    <div v-else class="w-full h-full flex justify-center items-center ">
        <Icon name="user" size="6em" label="No profile picture" />
    </div>
  </div>
</template>
<script setup>
import Icon from '@/components/ui/Icon.vue'
const props = defineProps({
  src: String,
})
</script>
