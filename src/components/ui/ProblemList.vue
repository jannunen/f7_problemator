<template >
  <div>
    <f7-list>
      <div class="list-group" v-for="wall in walls" :key="wall">
          <li class="list-group-title">{{ wall }}</li>
        <f7-list-item
          v-for="problem in getProblems('A')"
          :key="problem.id"
          link="#"
          :header="getAuthor(problem)"
          :after="getAfter(problem)"
        >
          <template #title>
            {{ problem.grade?.name }}
          </template>
          <template #media>
            <round-badge
              :width="20"
              :bgColor="problem.colour.code"
            ></round-badge>
            {{ getTagShort(problem.tag) }}
          </template>
        </f7-list-item>
      </div>
    </f7-list>
  </div>
</template>
<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "framework7-vue";
import { useI18n } from "vue-i18n";
import RoundBadge from "./RoundBadge.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default {
  components: { RoundBadge },
  props: {
    wall: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const { t, d, locale } = useI18n();
    const problemsByWall = useStore("problemsByWall");
    onMounted(() => {});
    const getGroupTitle = (group) => {
      return group.wallchar + " " + group.walldesc;
    };
    const getAuthor = (group) => {
      return t("home.by") + " " + group.author;
    };
    const getAfter = (group) => {
      const date = dayjs(group.added);
      return date.fromNow();
    };
    const getTagShort = (tag) => {
      if (tag == null) {
        return "";
      }

      return tag.substring(tag.length - 4);
    };
    const walls = computed(() => {
      if (problemsByWall.value == null) {
        return [];
      }
      return Object.keys(problemsByWall.value).sort((a, b) =>
        a.localeCompare(b)
      );
    });
    const getProblems = (wallchar) => {
      if (problemsByWall.value == null) {
        return [];
      }
      const probs = problemsByWall.value[wallchar];
      return probs.problems;
    };

    return {
      walls,
      problemsByWall,
      getGroupTitle,
      getAuthor,
      getTagShort,
      getAfter,
      getProblems,
    };
  },
  components: {
    RoundBadge,
  },
};
</script>
<style >
</style>