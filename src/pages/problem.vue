<template>
  <f7-page name="problem_details" >
    <f7-navbar :title="$t('problem.details')" back-link="Back"></f7-navbar>
        <!-- Details title -->
        <h2 class="flex flex-row justify-center font-bold text-xl">
           <span v-if="problem.routetype=='sport'">
               {{ $t('problem.route ')}}
           </span>
           <span v-else>
               {{ $t('problem.problem')}}
           </span>
            &nbsp;{{ getTagShort(problem.tag) }}
        </h2>

        <!-- problem details -->
        <div class="grid grid-cols-3 gap-4 my-3">
            <div class="bg-gray-300 rounded-r-2xl flex flex-col items-center">
                <h1 class="text-4xl p-2 m-1">{{ problem.grade.name }}</h1>
                        <round-badge
                        :width="32"
                        :bgColor="problem.colour.code"
                        ></round-badge>
                        <list-styles class="my-2" :styles="problem.styles"></list-styles>
                        <div class="my-2 text-sm text-gray-700 font-bold">{{ problem.ascentCount }} {{ $t('problem.ascents') }}</div>
                        <div class="my-2 text-sm text-gray-700 ">{{ problem.c_like }} {{ $t('problem.likes') }}</div>
                        <div class="mb-2 flex flex-row">
                            <f7-icon material="favorite" color="red"></f7-icon><span class="font-bold">{{ $t('problem.dolike') }}</span>
                        </div>
            </div>
            <div class="col-span-2 p-4">

                <!-- Show author and addition date -->
                <div class="my-2 flex flex-row justify-between">
                     <span class="font-bold">{{ problem.author }}</span>
                     <span class="">{{ $filters.fromNow(problem.added) }}</span>
                </div>
                <!-- Show additional details -->
                <div class="my-2 flex flex-row justify-between">
                     <span class="font-bold">{{ $t('problem.notes') }}</span>
                     <span class="" v-html="(problem.addt || 'N/A')"></span>
                </div>
                <!-- Show grade opinions -->
                <div class="my-2" >
                    <f7-block-title>{{ $t('problem.grade_opinions')}}</f7-block-title>
                    <grade-opinions :grades="cutGrades(grades,problem.grade.id,leaveOnBothSides)" :opinions="cutOpinions(problem.grade_opinions,problem.grade.id,leaveOnBothSides)"></grade-opinions>
                </div>
                <!-- Show dislikes -->
                <div class="my-2 flex-col">
                    <div class="my-2">
                        {{ problem.dislikeCount || 0 }} {{ $t('problem.dislikes')}}
                    </div>
                    <div class="font-bold my-2">
                        <f7-icon material="sentiment_dissatisfied"></f7-icon> {{ $t('problem.dislike')}}
                    </div>
                </div>


            </div>
        </div>



  </f7-page>
</template>

<script>
import RoundBadge from "@components/ui/RoundBadge.vue";
import GradeOpinions from "@components/ui/problem/GradeOpinions.vue"
import ListStyles from "@components/ui/problem/ListStyles.vue";
import { getTagShort } from '@js/helpers.js'
import { useStore } from 'framework7-vue'
import { ref } from 'vue'

export default {
    props : {
        problem : {
            type : Object,
            default : null,
        }
    },
    setup(props, context) {
        const grades = useStore('grades')
        const leaveOnBothSides =ref(3)
        const cutOpinions = (opinions,cutAt,leave) => {
            // Find first the index of cutAt and slice accordingly
            const idx = opinions.findIndex(item => item.gradeid == cutAt)
            const start = Math.max(0,idx-leave)
            const end = Math.min(opinions.length-1, idx+leave)
            return opinions.slice(start,end)
        }
        const cutGrades = (grades,cutAt,leave) => {
            // Find first the index of cutAt and slice accordingly
            const idx = grades.findIndex(item => item.id == cutAt)
            const start = Math.max(0,idx-leave)
            const end = Math.min(grades.length-1, idx+leave)
            return grades.slice(start,end)
        }
        return {
            getTagShort,
            grades,
            cutOpinions,
            cutGrades,
            leaveOnBothSides,
        }

    },
    components : {
        RoundBadge,
        ListStyles,
        GradeOpinions,
    }


}
</script>

<style>

</style>