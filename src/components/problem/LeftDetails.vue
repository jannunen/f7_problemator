<template>
  <div class="bg-gray-300 rounded-r-2xl flex flex-col items-center">
    <h1 class="text-4xl p-2 m-1">{{ problem.grade.name }}</h1>
    <round-badge :width="32" :bgColor="problem.colour.code"></round-badge>
    {{ getTagShort(problem.tag) }}
    <small class="mt-2">{{ $t('problem.attributes') }}:</small>
    <list-styles class="my-2" :styles="problem.styles"></list-styles>
    <div class="my-2 text-sm text-gray-700 font-bold">
      {{ $tc('problem.ascents', problem.ascentCount) }}
    </div>
    <div class="mt-2 text-sm text-gray-700">
      {{ $tc('problem.likes', problem.likeCount) }}
    </div>
    <div class="mb-2 flex flex-row p-3">
      <button raised class="bg-white text-purple-900">
        <div material="favorite" color="red"></div>
        <span class="font-bold">{{ $t('problem.dolike') }}</span>
      </button>
    </div>
    <!-- show ticked if so -->
    <div class="my-2" v-if="problem.myTicks != null && problem.myTicks.length > 0">
      <div class="bg-green-500 px-2 py-1 text-white text-center text-xs rounded-full">
        {{ $t('problem.ticked') }}
        <div size="12px" material="check"></div>
      </div>
      <button @click="myTicksPopupOpen = true" class="my-2 text-purple-700">{{
        $t('problem.see_ticks')
      }}</button>
    </div>

    <!-- Show project if so -->
    <div
      class="my-2"
      v-if="
        problem.myTicks != null &&
        problem.myTicks.length == 0 &&
        problem.myProjects.length > 0
      "
    >
      <div class="bg-yellow-500 px-2 py-1 text-white text-center text-xs rounded-full">
        {{ $t('problem.projecting') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { getTagShort } from "@js/helpers.js";
import ListStyles from "@components/ui/problem/ListStyles.vue";
import RoundBadge from "@components/ui/RoundBadge.vue";
const props = defineProps({
  problem : Object,
})
</script>

<style></style>
