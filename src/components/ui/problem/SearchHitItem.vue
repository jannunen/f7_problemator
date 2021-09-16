<template>
  <f7-list-item @click="$emit('start_navigate')" :link="`/problems/` + problem.id" :title="getTagShort(problem.tag)"> </f7-list-item>
</template>

<script>
import { debounce, getTagShort } from "@js/helpers";
export default {
  props: {
    problem: Object,
  },
  emits : ['start-navigate'],
  setup(props) {
    return {
      getTagShort,
    };
  },
};
</script>

<style></style>
