<template >
  <div>
    <f7-block>
      <f7-row>
        <f7-col>
          <f7-list accordion-list>
            <f7-list-item accordion-item :title="$t('home.filters')">
              <f7-accordion-content>
                <f7-block>
                  <p>
                    <grade-filter
                      :min="mirror.filters.gradeMin"
                      :max="mirror.filters.gradeMax"
                      :grades="grades"
                      @min="minChanged"
                      @max="maxChanged"
                    ></grade-filter>
                    <style-filter :styles="mirror.filters.style"></style-filter>
                    <!--sort-by v-model="$localStorage.filters.sortBy"></sort-by-->
                  </p>
                </f7-block>
              </f7-accordion-content>
            </f7-list-item>
          </f7-list>
        </f7-col>
      </f7-row>
    </f7-block>
    <f7-list>
        <div v-for="(problem,idx) in getProblems" :key="problem.id">

        <li v-if="wallNamesDiffer(idx)" class="list-group-title">{{ problem.wall?.wallchar }} {{ problem.wall?.walldesc }}</li>
        <f7-list-item
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
import GradeFilter from "@components/ui/problemlist/GradeFilter.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createLocal, createSession, createStorage } from "the-storages";
dayjs.extend(relativeTime);
import store from '@js/store.js'

export default {
  components: { RoundBadge },
  props: {
    wall: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const mirror = ref(null);
    mirror.value = createLocal();
    const storage = ref(null);
    storage.value = mirror._prx;
    const { t, d, locale } = useI18n();
    const problems= useStore("problems");
    const walls = useStore("walls")
    const grades = useStore('grades')
    const filters = useStore('filters')
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
    const sortedWalls = computed(() => {
      if (walls.value == null) {
        return [];
      }
      return walls.value.sort((a, b) => a.wallchar.localeCompare(b.wallchar))
    });
    const getProblems = computed(() => {
      if (problems.value == null) {
        return [];
      }
      /*
      let probs = problems.value.filter(item => {
          if (item.wall != null) {
            return item.wall.wallchar == wallchar
          }
          return false
          });
          */
         let probs = problems.value
        if (filters.value.gradeMax!= null) {
            probs = probs.filter((item => item.grade.score <= filters.value.gradeMax.score ))
        }
        if (filters.value.gradeMin !=null) {
            probs = probs.filter((item => item.grade.score >= filters.value.gradeMin.score ))
        }
        return probs
    });
  const  debounce = (func, timeout = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
  }
    const minChanged = debounce((value) => {
        store.dispatch('setGradeMin',value)
    })
    const maxChanged = debounce((value) => {
        store.dispatch('setGradeMax',value)
    })
    const filteredProblems = computed(() => {
        let probs = problems.value
        if (filters.value.gradeMax!= null) {
            probs = probs.filter((item => item.grade.score <= filters.value.gradeMax.score ))
        }
        if (filters.value.gradeMin !=null) {
            probs = probs.filter((item => item.grade.score >= filters.value.gradeMin.score ))
        }
        return probs
    })

        const wallNamesDiffer = (idx) => {
            if (idx < 1) {
                return true
            }
            const a = filteredProblems.value[idx]
            const b = filteredProblems.value[idx-1]
            if (a.wall == null || b.wall == null) {
                return false
            }
            return a.wall.wallchar != b.wall.wallchar

        }
    return {
sortedWalls,
wallNamesDiffer,
      mirror,
      storage,
      problems : filteredProblems,
      getGroupTitle,
      getAuthor,
      getTagShort,
      getAfter,
      getProblems,
      grades,
      minChanged,
      maxChanged,
    };
  },
  components: {
    RoundBadge,
    GradeFilter,
  },
};
</script>
<style >
</style>