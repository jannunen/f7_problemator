<template>
    <f7-sheet :opened="opened" style="height : 60%;" @sheet:close="onSheetClose" swipe-to-close backdrop>
        <f7-toolbar>
            <div class="left"></div>
            {{ t('publicascents.title') }}
            <div class="right">
                <f7-link sheet-close>Close</f7-link>
            </div>
        </f7-toolbar>
        <f7-page-content class="m-0 p-0">
            <f7-block v-if="ascents != null && ascents.length > 0">
                <div class="my-1">{{ ascents.length }} {{ t('publicascents.ascents') }}</div>
                <br /> {{ t('publicascents.not_all_ascents_are_public') }}
                <f7-list media-list>
                    <f7-list-item v-for="(asc, idx) in ascents" :key="asc.id" >
                        <template #subtitle>
                        {{ toLocalTime(asc.tstamp) }}
                         ({{ showAgo(asc.tstamp)}})
                        </template>
                        <template #after>
                            <div v-html="showTryText(asc.tries)"></div>
                        </template>
                        <template #title>
                            <div v-if="asc.climber != null">
                            {{ asc.climber?.etunimi || 'Secret'}} {{ asc.climber?.sukunimi || 'Nugget'}}
                            </div>
                            <div v-else>
                               {{ t('publicascents.secret_climber') }}
                            </div>
                        </template>
                        <template #media>
                           {{ idx+1 }}. 
                        </template>
                    </f7-list-item>
                </f7-list>

            </f7-block>
        </f7-page-content>
        
    </f7-sheet>
</template>
  
<script setup>
import { useI18n } from 'vue-i18n'
import { showAgo, toLocalTime } from '@helpers'
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
const store = useStore()
const { t } = useI18n()

const ascents = ref([])

const showTryText = (tries) => {
    const flashText = (props.problem.routetype == 'boulder')  ? 'Flash' : 'Onsight'
    if (tries == 1) {
        return `<span class="text-yellow-400 font-bold">*${flashText}*</span>`
    }
    return tries +  " tries"
}
const props = defineProps({
    problem : Object,
    opened: Boolean,
})
onMounted(() => {
    store.dispatch("getPublicAscents", props.problem.id)
        .then((a) => {
            ascents.value = a.ascents
        })
})

const emits = defineEmits(['close'])
const onSheetClose = () => {
    emits('close')
}
</script>