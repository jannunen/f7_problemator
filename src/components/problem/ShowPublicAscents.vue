<template>
    <f7-sheet :opened="opened" style="height:auto; " @sheet:close="onSheetClose" swipe-to-close backdrop>
        <f7-page-content>
            <f7-block-title large>{{ t('publicascents.title') }} (<small>{{ ascents.length }} {{ t('publicascents.ascents') }}</small>)</f7-block-title>
            <f7-block>
                <br /> {{ t('publicascents.not_all_ascents_are_public') }}
                <br />
                <f7-list media-list>
                    <f7-list-item v-for="(asc, idx) in ascents.reverse()" :key="asc.id" >
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
/*
import store from '@js/store.js'
import { useStore } from "framework7-vue"
import { left, getTagShort } from '@js/helpers'
import { ref, onMounted, computed } from "vue"
import { emit } from 'process'
const grades = computed(() => store.state.grades)
*/
const { t } = useI18n()


const showTryText = (tries) => {
    const flashText = (props.problem.routetype == 'boulder')  ? 'Flash' : 'Onsight'
    if (tries == 1) {
        return `<span class="text-yellow-400 font-bold">*${flashText}*</span>`
    }
    return tries +  " tries"
}
const props = defineProps({
    problem : Object,
    ascents: { type: Array, default: [] },
    opened: Boolean,
})
const emits = defineEmits(['close'])
const onSheetClose = () => {
    emits('close')
}
</script>