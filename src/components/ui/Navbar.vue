<template>
    <div class="flex flex-row h-12 text-black bg-gray-300 justify-between py-2 text-lg px-2">
        <div class="flex-none w-16"> <slot name="left"></slot> </div>
        <div class="flex-grow"><slot></slot></div>
        <div class="flex-none w-16"><slot name="right"></slot></div>
    </div>
</template>

<script>
export default {

}
</script>

<style>

</style>