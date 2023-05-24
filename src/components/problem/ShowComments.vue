<template>
    <f7-sheet :opened="opened" style="height : 60%;" @sheet:close="onSheetClose" swipe-to-close backdrop>
        <f7-toolbar>
            <div class="left"></div>
            {{ t('showcomments.title') }}
            <div class="right">
                <f7-link sheet-close>Close</f7-link>
            </div>
        </f7-toolbar>
        <f7-page-content class="m-0 p-0">
            <f7-block v-if="problem.messages != null && problem.messages.length > 0">
                <f7-block-title> {{ t('showcomments.showing_only_moderated') }}</f7-block-title>

                <div class="my-1">{{ problem.messages.length }} {{ t('showcomments.comments') }}</div>
                <f7-list media-list>
                    <f7-list-item v-for="(m, idx) in problem.messages" :key="m.id" >
                        <template #subtitle>
                         <small>
                         by
                            {{  m.climber.etunimi  }}
                            {{  m.climber.sukunimi  }}
                            </small>
                        </template>
                        <template #after>
                            {{  toLocalTime(m.timestamp ) }}
                        </template>
                        <template #title>
                            {{  m.message  }}
                        </template>
                        
                    </f7-list-item>
                </f7-list>
            </f7-block>
            <f7-block v-else>
                <div class="my-1">{{ t('showcomments.no_comments') }}</div>
            </f7-block>
        </f7-page-content>
        
    </f7-sheet>
</template>
  
<script setup>
import { useI18n } from 'vue-i18n'
import { showAgo } from '@helpers'
import { computed, ref, onMounted } from 'vue'
import {  toLocalTime } from '@helpers/component.helpers'
import { useStore } from 'vuex'
const store = useStore()
const { t } = useI18n()

const props = defineProps({
    problem : Object,
    opened: Boolean,
})

const emits = defineEmits(['close'])
const onSheetClose = () => {
    emits('close')
}
</script>