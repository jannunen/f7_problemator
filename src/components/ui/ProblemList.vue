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
                      :min="filters.gradeMin"
                      :max="filters.gradeMax"
                      :grades="grades"
                      @min="minChanged"
                      @max="maxChanged"
                    ></grade-filter>
                    <style-filter @styles-changed="onStylesChanged" :styles="styles" :selected-styles="filters.styles"></style-filter>
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
        <f7-block-title>{{ filteredProblems?.length }} {{ $t('home.visible out of') }} {{ problems?.length }} {{ $t('home.problems') }}</f7-block-title>

        <div v-for="(problem,idx) in filteredProblems" :key="problem.id">
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
import StyleFilter from "@components/ui/problemlist/StyleFilter.vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { createLocal, createSession, createStorage } from "the-storages";
import { debounce } from '@js/helpers'
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
    const styles = useStore('styles')
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
  
    const minChanged = debounce((value) => {
        store.dispatch('setGradeMin',value)
    })
    const maxChanged = debounce((value) => {
        store.dispatch('setGradeMax',value)
    })
    const onStylesChanged = (styles) => {
        // set active filters.
        store.dispatch('setStyles',styles)
    }
    const filteredProblems = computed(() => {
        let probs = problems.value
        if (filters.value.gradeMax!= null) {
            probs = probs.filter((item => item.grade.score <= filters.value.gradeMax.score ))
        }
        if (filters.value.gradeMin !=null) {
            probs = probs.filter((item => item.grade.score >= filters.value.gradeMin.score ))
        }
        if (filters.value.styles !=null && filters.value.styles.length > 0) {
            probs = probs.filter((item) => {
                return filters.value.styles.every(i => item.styles.includes(i));
            })
        }
        return probs
    })

        const wallNamesDiffer = (idx) => {
            if (idx < 1) {
                return true
            }
            const a = filteredProblems.value[idx]
            const b = filteredProblems.value[idx-1]
            if (a  == null || b == null || a.wall == null || b.wall == null) {
                return false
            }
            return a.wall.wallchar != b.wall.wallchar

        }
    return {
      sortedWalls,
      wallNamesDiffer,
      mirror,
      storage,
      filteredProblems,
      problems,
      getGroupTitle,
      getAuthor,
      getTagShort,
      getAfter,
      grades,
      filters,
      styles,
      minChanged,
      maxChanged,
      onStylesChanged,
    };
  },
  components: {
    RoundBadge,
    GradeFilter,
    StyleFilter,
  },
};
</script>
<style >
</style>