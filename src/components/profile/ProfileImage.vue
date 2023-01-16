<template>
  <div
    class="mx-auto w-44 h-44 border-2 border-white rounded-full bg-black overflow-hidden relative -top-20 bg-black"
  >
    <img v-if="src != null" :src="src" alt="Profile image" />
    <div v-else class="w-full h-full flex justify-center items-center ">
        <i class="fa fa-user" style="font-size : 6em;"></i>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  src: String,
})
</script>
