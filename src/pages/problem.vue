<template>
  <f7-page name="problem_details">
    <f7-navbar :title="$t('problem.details')" :back-link="$t('global.back')"></f7-navbar>
    <div v-if="problem != null && problem.id != null">
      <!-- Details title -->
      <h2 class="flex flex-row justify-center font-bold text-xl">
        <span v-if="problem.routetype == 'sport'">
          {{ $t("problem.route ") }}
        </span>
        <span v-else>
          {{ $t("problem.problem") }}
        </span>
        &nbsp;{{ getTagShort(problem.tag) }}
      </h2>
      <small class="mx-2"
        ><small>id: {{ problem.id }}</small></small
      >

      <!-- problem details -->
      <div class="grid grid-cols-3 gap-4 my-3">
        <!-- left col -->
        <div class="bg-gray-300 rounded-r-2xl flex flex-col items-center">
          <h1 class="text-4xl p-2 m-1">{{ problem.grade.name }}</h1>
          <round-badge :width="32" :bgColor="problem.colour.code"></round-badge>
          {{ getTagShort(problem.tag) }}
          <list-styles class="my-2" :styles="problem.styles"></list-styles>
          <div class="my-2 text-sm text-gray-700 font-bold">
            {{ $tc("problem.ascents", problem.ascentCount) }}
          </div>
          <div class="mt-2 text-sm text-gray-700">
            {{ $tc("problem.likes", problem.likeCount) }}
          </div>
          <div class="mb-2 flex flex-row p-3">
            <f7-button raised class="bg-white text-purple-900">
              <f7-icon material="favorite" color="red"></f7-icon
              ><span class="font-bold">{{ $t("problem.dolike") }}</span>
            </f7-button>
          </div>
          <!-- show ticked if so -->
          <div class="my-2" v-if="problem.myTicks != null && problem.myTicks.length > 0">
            <div
              class="bg-green-500 px-2 py-1 text-white text-center text-xs rounded-full"
            >
              {{ $t("problem.ticked") }}
              <f7-icon size="12px" material="check"></f7-icon>
            </div>
            <f7-link @click="myTicksPopupOpen=true"  class="my-2 text-purple-700">{{
              $t("problem.see_ticks")
            }}</f7-link>
          </div>

          <!-- Show project if so -->
          <div
            class="my-2"
            v-if="problem.myTicks.length == 0 && problem.myProjects.length > 0"
          >
            <div
              class="bg-yellow-500 px-2 py-1 text-white text-center text-xs rounded-full"
            >
              {{ $t("problem.projecting") }}
            </div>
          </div>
        </div>

        <!-- right col -->
        <div class="col-span-2 p-4">
          <!-- Show author and addition date -->
          <strong v-if="problem.routetype == 'boulder'">{{
            $t("problem.problem_info")
          }}</strong>
          <strong v-if="problem.routetype == 'sport'">{{
            $t("problem.route_info")
          }}</strong>
          <div class="my-2 flex flex-row justify-between">
            <span class="">{{ problem.author }}</span>
            <span class="">{{ $filters.fromNow(problem.added) }}</span>
          </div>
          <!-- Show additional details -->
          <div class="my-2 flex flex-row justify-between">
            <span class="font-bold">{{ $t("problem.notes") }}</span>
            <span class="" v-html="problem.addt || 'N/A'"></span>
          </div>

          <!-- Show grade opinions -->
          <div class="my-2">
            <f7-block-title>{{ $t("problem.grade_opinions") }}</f7-block-title>
            <grade-opinions
              :grades="cutGrades(grades, problem.grade.id, leaveOnBothSides)"
              :opinions="
                cutOpinions(problem.grade_opinions, problem.grade.id, leaveOnBothSides)
              "
            ></grade-opinions>
          </div>
          <!-- Show dislikes -->
          <div class="my-2 flex-col">
            <div class="my-2">
              {{ $tc("problem.dislikes", problem.dislikeCount) }}
            </div>
            <div class="font-bold my-2">
              <f7-button class="bg-white text-purple-900" raised>
                <f7-icon material="sentiment_dissatisfied"></f7-icon>
                {{ $t("problem.dislike") }}
              </f7-button>
            </div>
          </div>
        </div>
      </div>
      <div class="col-span-3 m-2">
        <button @click="addTickSheetOpened = true" class="button bg-red-500 text-white">
          {{ $t("problem.btn_add_tick") }}
        </button>
      </div>

      <!-- top part ends -->

      <!-- sheet: my ticks -->
      <f7-popup
        animate
        swipe-to-close
        :opened="myTicksPopupOpen"
        @sheet:opened="addTickSheetOpened = false"
        @sheet:closed="addTickSheetOpened = true"
        style="background-color: #e5e4e5"
        class="popup_ticks border-red-100 rounded-t-2xl"
      >
        <f7-page>
          <f7-navbar :title="$t('ticklist.popup_title')">
            <f7-nav-right>
              <f7-link @click="myTicksPopupOpen=false">Close</f7-link>
            </f7-nav-right>
          </f7-navbar>
          <f7-block>
            <p>{{ $t("problem.tick_list_info") }}</p>
            <tick-list
              :problem="problem"
              :ticks="problem.myTicks"
              :projects="problem.myProjects"
            ></tick-list>
            <div class="mb-4">
              <f7-button @click="myTicksPopupOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          </f7-block>
        </f7-page>
      </f7-popup>

      <!-- sheet add tick -->
      <f7-sheet
        animate
        bottom
        :opened="addTickSheetOpened"
        style="background-color: #e5e4e5; height : auto;"
        class="sheet_addtick border-red-100 rounded-t-2xl"
      >
        <!--
      <div class="flex flex-row justify-center" >
         <div class="bg-white rounded-full h-1 mt-2 w-32 "></div> 
         </div>
         -->
        <div class="flex p-3 mt-2 grid grid-cols-3">
          <div
            class="flex flex-col items-center justify-center font-bold"
            @click="openTickDatePopup"
          >
            <i
              class="icon material-icons color-custom"
              style="font-size: 42px; color: #2f2d51"
              >today</i
            >
            {{ formatDate(tick.created) }}
          </div>
          <div
            class="flex flex-col items-center justify-center font-bold"
            @click="openTriesPopup"
          >
            <round-badge text-color="#fff" bg-color="#2F2D51" :width="38">{{
              tick.tries
            }}</round-badge>
            {{ $tc("problem.tries", tick.tries) }}
          </div>
          <div
            class="flex flex-col items-center justify-center font-bold"
            @click="openGradeOpinionPopup"
          >
            <round-badge text-color="#fff" bg-color="#2F2D51" :width="38">{{
              getGrade(tick.grade_opinion)
            }}</round-badge>
            {{ $t("problem.grade_opinion") }}
          </div>
        </div>
        <div class="flex flex-row p-3 mt-1 font-bold grid grid-cols-2">
          <div class="flex justify-center">
            <f7-radio
              :checked="tick.ticktype == 'tick'"
              name="ticktype"
              value="tick"
              @change="() => onAscentTypeChange('tick')"
            ></f7-radio>
            {{ $t("problem.send") }}
          </div>
          <div>
            <f7-radio
              :checked="tick.ticktype == 'pretick'"
              :disabled="problem.myTicks != null && problem.myTicks.length > 0"
              name="ticktype"
              value="pretick"
              @change="() => onAscentTypeChange('pretick')"
            ></f7-radio>
            {{ $t("problem.still_a_project") }}
            <small v-if="problem.myTicks != null && problem.myTicks.length > 0">{{
              $t("problem.projecting_not_possible")
            }}</small>
          </div>
        </div>
        <div class="my-2 mx-4">
          <f7-button @click="saveTick" large round fill color="blue"
            >+ {{ $t("problem.add_a_tick") }}</f7-button
          >
          <f7-button class="my-1" @click="addTickSheetOpened = false" large round fill color="red"
            >{{ $t("global.close_action") }}</f7-button
          >
        </div>
      </f7-sheet>

      <!-- Popups for grade opinion, tries and such -->
      <f7-popup
        animate
        :opened="popupTickDateOpen"
        @popup:closed="addTickSheetOpened = true"
        @popup:open="onTickDatePopupOpened"
        class="popup_tick_date"
      >
        <f7-page>
          <f7-navbar :title="$t('problem.popup_title_date')">
            <f7-nav-right>
              <f7-link @click="popupTickDateOpen = false">{{
                $t("problem.close_action")
              }}</f7-link>
            </f7-nav-right>
          </f7-navbar>
          <f7-block>
            <f7-block-title>{{ $t("problem.choose_tick_date") }}</f7-block-title>

            <div class="flex flex-row justify-around">
              <f7-button
                @click="setCalendarDate(dayjs().subtract(1, 'day').toDate())"
                class="mx-2"
                round
                fill
                color="red"
                >{{ $t("problem.yesterday") }}
              </f7-button>
              <f7-button
                @click="setCalendarDate(dayjs().toDate())"
                class="mx-2"
                round
                fill
                color="red"
                >{{ $t("problem.today") }}
              </f7-button>
            </div>
            <div id="calendar-inline-container"></div>
            <div class="mx-2">
              <f7-button @click="popupTickDateOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          </f7-block>
        </f7-page>
      </f7-popup>

      <f7-popup animate :opened="popupTriesOpen" 
      @popup:open="addTickSheetOpened= false"
        @popup:closed="addTickSheetOpened = true"

      swipe-to-close class="popup_tries">
        <f7-page>
          <f7-navbar :title="$t('problem.popup_title_tries')">
            <f7-nav-right>
              <f7-link @click="popupTriesOpen = false">{{
                $t("problem.close_action")
              }}</f7-link>
            </f7-nav-right>
          </f7-navbar>
          <f7-block>
            <f7-block-title>{{ $t("problem.how_many_tries") }}</f7-block-title>

            <f7-list>
              <f7-list-item
                @click="selectTries(n)"
                v-for="n in 8"
                radio
                radio-icon="end"
                :key="n"
                :title="n"
                name="tries"
                :checked="n == 1"
              ></f7-list-item>

              <li class="mx-2">{{ $t("problem.or_enter_custom_amount") }}</li>
              <li class="item-content item-input">
                <div class="item-inner">
                  <div class="item-input-wrap">
                    <input
                      type="number"
                      v-model="preTries"
                      :placeholder="$t('problem.custom_amt_tries')"
                    />
                    <span class="input-clear-button"></span>
                  </div>
                </div>
                <f7-button @click="selectTries(preTries)">{{
                  $t("problem.save_tries")
                }}</f7-button>
              </li>
            </f7-list>
            <div class="mx-2">
              <f7-button @click="popupTriesOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          </f7-block>
        </f7-page>
      </f7-popup>

      <f7-popup
        animate
        swipe-to-close
        @popup:closed="addTickSheetOpened = true"
        @popup:open="addTickSheetOpened= false"
        :opened="popupGradeOpinionOpen"
        class="popup_grade_opinion"
      >
        <f7-page>
          <f7-navbar :title="$t('problem.popup_title_grade_opinion')">
            <f7-nav-right>
              <f7-link @click="popupGradeOpinionOpen = false">{{
                $t("global.close_action")
              }}</f7-link>
            </f7-nav-right>
          </f7-navbar>
          <f7-block class="mb-12">
            <f7-block-title>{{
              $t("problem.what_is_your_grade_opinion")
            }}</f7-block-title>
            <f7-list>
              <f7-list-item
                @click="gradeOpinionSelected(null)"
                radio
                radio-icon="end"
                :title="$t('problem.no_opinion')"
                name="demo-radio-end"
                checked
              ></f7-list-item>
              <f7-list-item
                @click="() => gradeOpinionSelected(grade.id)"
                v-for="grade in grades"
                :key="grade.id"
                radio
                radio-icon="end"
                :title="grade.name"
                name="demo-radio-end"
              ></f7-list-item>
            </f7-list>
            <div class="mx-2">
              <f7-button @click="popupGradeOpinionOpen=false" large round fill color="blue">{{
                $t("global.close_action")
              }}</f7-button>
            </div>
          </f7-block>
        </f7-page>
      </f7-popup>
    </div>
  </f7-page>
</template>

<script>
import RoundBadge from "@components/ui/RoundBadge.vue";
import GradeOpinions from "@components/ui/problem/GradeOpinions.vue";
import TickList from "@components/ui/problem/TickList.vue";
import ListStyles from "@components/ui/problem/ListStyles.vue";
import { getTagShort } from "@js/helpers.js";
import { useStore } from "vuex";
import store from "@js/store/store.js";
import { ref, onMounted, computed } from "vue";
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(LocalizedFormat);
import { f7, f7ready } from "framework7-vue";
import { toaster } from "@js/helpers.js";

export default {
  props: {
    problemId: {
      type: String,
      default: null,
    },
  },
  setup(props, context) {
    const { t, d, locale } = useI18n();
    const tick = ref({});
    const isGradeOpinionSelected = ref(false);
    const preTries = ref(1);
    const store = useStore();
    const problems = store.state.problems;
    const grades = store.state.grades;
    const leaveOnBothSides = ref(3);
    const calendar = ref(null);
    const popupTriesOpen = ref(false);
    const popupGradeOpinionOpen = ref(false);
    const popupTickDateOpen = ref(false);
    const myTicksPopupOpen = ref(false)
   const addTickSheetOpened = ref(false);
    const calendarInitialized = ref(false)

    const onTickDatePopupOpened = () => {
      addTickSheetOpened.value = false
      if (calendarInitialized.value == false) {
        calendar.value = f7.calendar.create({
          containerEl: "#calendar-inline-container",
          value: [tick.value.created],
          weekHeader: false,
        });
        calendar.value.on("change", (calendar, value) => {
          tick.value.created = value[0];
          popupTickDateOpen.value = false;
        });
        calendarInitialized.value = true
      }
    };
    onMounted(() => {
      store.dispatch("getProblem", props.problemId);
    });

    const cutOpinions = (opinions, cutAt, leave) => {
      // Find first the index of cutAt and slice accordingly
      if (opinions == null) {
        return [];
      }
      const idx = opinions.findIndex((item) => item.gradeid == cutAt);
      const start = Math.max(0, idx - leave);
      const end = Math.min(opinions.length - 1, idx + leave);
      return opinions.slice(start, end);
    };
    const problem = computed(() => {
      const p = store.state.problems[props.problemId];
      return p;
    });
    tick.value.ticktype = "tick";
    tick.value.tries = 1;
    tick.value.created = new Date();
    tick.value.problemid = props.problemId;
    tick.value.grade_opinion = null;

    const cutGrades = (grades, cutAt, leave) => {
      if (grades == null) {
        return [];
      }
      // Find first the index of cutAt and slice accordingly
      const idx = grades.findIndex((item) => item.id == cutAt);
      const start = Math.max(0, idx - leave);
      const end = Math.min(grades.length - 1, idx + leave);
      return grades.slice(start, end);
    };
    const onAscentTypeChange = (value) => {
      tick.value.ticktype = value;
    };
    const openGradeOpinionPopup = () => {
      popupGradeOpinionOpen.value = true;
    };
    const openTriesPopup = () => {
      popupTriesOpen.value = true;
    };
    const openTickDatePopup = () => {
      popupTickDateOpen.value = true;
    };
    const getGrade = (gradeid) => {
      if (gradeid == null) {
        return "";
      }
      return grades[gradeid].name;
    };
    const selectTries = (tries) => {
      tick.value.tries = tries;
      popupTriesOpen.value=false
    };
    const gradeOpinionSelected = (gradeid) => {
      tick.value.grade_opinion = gradeid;
      popupGradeOpinionOpen.value = false
    };
    const formatDate = (date) => {
      if (dayjs(date).isSame(new Date(), "day")) {
        return t("problem.today");
      }
      return dayjs(date).format("DD.MM.YYYY");
    };
    const setCalendarDate = (date) => {
      calendar.value.setValue([date]);
    };
    const saveTick = () => {
      // IF use has NOT selected grade opinion, make sure one is
      // NOT sent to the server
      let payload = { ...tick.value };
      store
        .dispatch("saveTick", payload)
        .then((resp) => {
          toaster(resp.message);
        })
        .catch((err) => {
          f7.dialog.alert(err);
        });
    };
    return {
      saveTick,
      addTickSheetOpened,
      getTagShort,
      calendarInitialized,
      preTries,
      grades,
      cutOpinions,
      cutGrades,
      leaveOnBothSides,
      onAscentTypeChange,
      tick,
      openGradeOpinionPopup,
      getGrade,
      popupGradeOpinionOpen,
      popupTickDateOpen,
      openTriesPopup,
      myTicksPopupOpen,
      selectTries,
      gradeOpinionSelected,
      openTickDatePopup,
      formatDate,
      calendar,
      dayjs,
      problem,
      popupTriesOpen,
      onTickDatePopupOpened,
      setCalendarDate,
    };
  },
  components: {
    RoundBadge,
    ListStyles,
    GradeOpinions,
    TickList,
  },
};
</script>

<style></style>
