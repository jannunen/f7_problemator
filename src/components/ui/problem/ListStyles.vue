<template>
    <div v-if="styles.length > 0" class="flex flex-wrap ">
        <small class="text-white bg-green-600 py-0 rounded-lg px-2 text-xs mb-1 mr-1 " v-for="style in styles" :key="style" >{{ style }}</small>
    </div>
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