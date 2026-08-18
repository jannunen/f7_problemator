<template>
    <h1 class="font-bold text-red-500">{{ title }}</h1>
    <ul class="text-sm">
        <li v-for="(note, i) in notes" :key="i">{{ note }}</li>
    </ul>
</template>
<script setup>
 defineProps({
    title : String,
    notes : Array,
 })
</script>
