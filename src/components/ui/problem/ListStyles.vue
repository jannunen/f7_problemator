<template>
    <div class="flex flex-wrap flex-row">
        <div class="border-gray  py-0 px-1 my-1 mx-0 text-sm" v-for="style in styles" :key="style" >{{ style }}</div>
    </div>
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