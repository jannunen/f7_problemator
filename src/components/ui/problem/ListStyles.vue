<template>
    <span v-if="styles.length > 0" class="border-gray font-bold text-gray-600 py-0 my-0 mx-1 text-sm">
        <span class="pr-1" v-for="style in styles" :key="style" >{{ style }}</span>
    </span>
    <span v-else>N/A</span>
</template>

<script>
export default {
    props : {
        styles : {
            type : Array,
            default : [],
        }
    }

}
</script>

<style>

</style>