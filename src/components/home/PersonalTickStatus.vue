<template>
    <f7-block>
    <f7-row>
        <f7-col>
            {{ $t('pts.you_ticked') }}
            
            </f7-col>
        <f7-col>{{ $t('pts.you_tried') }}</f7-col>
        <f7-col>{{ $t('pts.total') }}</f7-col>

    </f7-row> 
    <f7-row> 
        <f7-col>
                <f7-progressbar color="green" :progress="80"></f7-progressbar>
        </f7-col>
    </f7-row>
    </f7-block>
</template>

<script>
export default {

}
</script>

<style>

</style>