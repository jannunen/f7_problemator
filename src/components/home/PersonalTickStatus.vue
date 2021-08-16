<template>
    <f7-block>
    <f7-row>
        <f7-col>
            {{ $t('pts.you_ticked') }}
            <round-badge border-color="#5fda5f">{{ getOwnTickCount }}</round-badge>     
        </f7-col>
        <f7-col>{{ $t('pts.you_tried') }}
            <round-badge border-color="#f08d0c">{{ getTriedCount }}</round-badge>     
        </f7-col>
        <f7-col>{{ $t('pts.total') }}
            <round-badge >{{ getTotalRoutes }}</round-badge>     

        </f7-col>

    </f7-row> 
    <f7-row> 
        <f7-col>
                <horizontal-bar-graph :height="8" :items=[10,25] :colours="['#5fda5f','#f08d0c']" :max="76"> </horizontal-bar-graph>
        </f7-col>
    </f7-row>
    </f7-block>
</template>

<script>
import RoundBadge from '@components/ui/RoundBadge.vue'
import store from '@js/store.js'
 import { computed } from 'vue';
 import { useStore } from 'framework7-vue';
import HorizontalBarGraph from '../ui/HorizontalBarGraph.vue';

export default {
    components : {
        RoundBadge,
    },
    computed : {
         
           getOwnTickCount : function() {
                if (this.profile.info != null) {
                    const ticks= this.profile.info.ticked.length || 0
                    return ticks
                }
                return 0
            },
            getTriedCount : function() {
                if (this.profile.info != null) {
                    const tried= this.profile.info.projects.length
                    return tried
                }
                return 0
            },
            getTotalRoutes : function() {
                if (this.profile.info != null) {
                    const total= this.profile.info.count
                    return total
                }
                return 0
            }

    },
    setup() {
            const profile = useStore('profile')
            return { profile}

    },
    methods : {
    },
    components : {
        HorizontalBarGraph,
        RoundBadge,
    }


}
</script>

<style>

</style>