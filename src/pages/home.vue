<template>
  <!-- FAB Backdrop -->
  <f7-fab-backdrop></f7-fab-backdrop>


  <f7-fab position="right-bottom">
    <f7-icon
      @click="openSearchTick"
      :text="$t('home.fab_add_route')"
      ios="f7:plus"
      aurora="f7:plus"
      md="material:add"
    ></f7-icon>
    <f7-icon ios="f7:xmark" aurora="f7:xmark" md="material:close"></f7-icon>
  </f7-fab>

  <f7-page name="home">
    <!-- Top Navbar -->
    <f7-navbar :sliding="false">
      <f7-nav-left>
        <f7-link
          icon-ios="f7:menu"
          icon-aurora="f7:menu"
          icon-md="material:menu"
          @click="store.commit('setSidePanelOpen', true)"
          panel-open="left"
        ></f7-link>
      </f7-nav-left>
    </f7-navbar>
    <div v-if="profileLoaded" class="mb-12">
      <div class="my-2 text-center font-bold text-md">
        {{ user.etunimi }} - {{ $t("home.logs") }}
      </div>
      <div class="my-2 text-center text-md">{{ $t("home.today") }}</div>
      <div class="flex flex-row justify-center mt-3">
        <div class="flex flex-col mx-4 text-center">
          <div class="text-5xl font-bold leading-8">{{ ticksToday }}<br /></div>
          <small class="mb-2">{{ $t("home.ascents") }}</small>
          <div class="text-sm text-center leading-3">{{ triesToday }}</div>
          <small>{{ $t("home.tries") }}</small>
        </div>
        <div class="mt-2">
          <button
            class="w-14 h-14 rounded-full bg-purple-800 p-2 text-white flex flex-col justify-center items-center font-bold"
          >
            <f7-icon material="add" color="white" size="12px"></f7-icon>
            <small>{{ $t("home.add") }}</small>
          </button>
        </div>
      </div>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Id</th>
            <th>Facebook Id</th>
            <th>Name</th>
            <th>Extra Info</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.id">
            <td>{{ account.id }}</td>
            <td>{{ account.facebookId }}</td>
            <td>{{ account.name }}</td>
            <td>{{ account.extraInfo }}</td>
            <td class="text-right" style="white-space: nowrap">
              <router-link :to="`/edit/${account.id}`" class="btn btn-sm btn-primary mr-1"
                >Edit</router-link
              >
              <button
                @click="deleteAccount(account.id)"
                class="btn btn-sm btn-danger btn-delete-account"
                :disabled="account.isDeleting"
              >
                <span
                  v-if="account.isDeleting"
                  class="spinner-border spinner-border-sm"
                ></span>
                <span v-else>Delete</span>
              </button>
            </td>
          </tr>
          <tr v-if="!accounts">
            <td colspan="5" class="text-center">
              <span class="spinner-border spinner-border-lg align-center"></span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Show floormaps -->
      <f7-block v-if="gym.floormaps.length > 0" class="my-0">
        <h3 class="no-margin">
          {{ $t("home.floor_maps") }}
          <small class="text-sm">{{ gym.floormaps?.length }} {{ $t("home.maps") }}</small>
        </h3>
        <div class="m-1">
          {{ $t("home.start_by_clicking_a_wall_or") }}
          <f7-link href="/problems" class="font-bold text-blue-700">{{
            $t("home.show_all_problems")
          }}</f7-link>
        </div>
        <div v-for="floormap in gym.floormaps" :key="floormap.id">
          <floor-map @area-selected="onAreaSelected" :map="floormap"></floor-map>
        </div>
      </f7-block>
      <f7-block else class="text-center">
        <f7-link
          href="/problems"
          class="font-bold text-white bg-blue-500 rounded-full py-2 px-8 block"
          >{{ $filters.capitalize($t("home.show_all_problems")) }}</f7-link
        >
      </f7-block>

      <my-logs @click="onMyLogsClicked"></my-logs>

      <!-- show climbed percentage status -->
      <div class="grid grid-cols-2">
        <div
          class="m-4 rounded-md raised shadow-lg p-4 bg-white flex flex-col items-center"
          @click="onStatusBadgeClicked"
        >
          <div class="font-bold text-lg" style="color: #3bb273">{{ gym.name }}</div>
          <div>
            {{ $t("home.climbed") }}
            <span class="text-md">{{ getClimbedPercentage }}%</span> {{ $t("home.of") }}
          </div>
          <div class="text-5xl">{{ getTotalRoutes }}</div>
          <div>{{ $t("home.of_routes") }}</div>
        </div>

        <div
          class="m-4 rounded-md raised shadow-lg p-4 bg-white flex flex-col items-center"
        >
          <div class="font-bold text-lg" style="color: #3bb273">Info</div>
          <div>Competitions and groups are coming later...</div>
        </div>
      </div>
    </div>
    <!-- if profileloaded -->
  </f7-page>
  <search-problems-sheet></search-problems-sheet>
</template>

<script>
import FloorMap from "@components/ui/FloorMap.vue";
import MyLogs from "@components/home/MyLogs.vue";
import { f7, f7ready } from "framework7-vue";
import { onMounted, computed, ref } from "vue";
import { useStore } from "vuex";
import SearchProblemsSheet from "@components/ui/problem/SearchProblemsSheet.vue";
import { accountService } from "@/js/auth/services";

export default {
  setup() {
    const store = useStore();
    const profileLoaded = computed(() => store.state.homeLoaded);
    const user = computed(() => store.state.user);
    const gym = computed(() => store.state.gym);
    const profile = computed(() => store.state.profile);
    const dlgSearchTickOpen = ref(false);
    const accounts = ref();

    const deleteAccount = (id) => {
      const account = accounts.value.find((x) => x.id === id);
      account.isDeleting = true;
      accountService
        .delete(id)
        .then(() => (accounts.value = accounts.value.filter((x) => x.id !== id)));
    };

    onMounted(() => {
      f7ready(() => {
        f7.preloader.show();
        store.dispatch("getProfile").then(() => {
          f7.preloader.hide();
        });
      });
    });
    const ticksToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = store.state.gym.problems;
      return probs.reduce((acc, prob) => {
        acc += prob.myTicks.length;
        return acc;
      }, 0);
    });

    const triesToday = computed(() => {
      // Go through gym problems for the ascents
      const probs = store.state.gym.problems;
      const triesToday = probs.reduce((acc, prob) => {
        acc += prob.myTicks.reduce((ticks, tick) => {
          ticks += parseInt(tick.tries);
          return ticks;
        }, 0);
        return acc;
      }, 0);
      return triesToday;
    });
    const onAreaSelected = (area) => {
      // Nafvigate to problems with selected wall
      f7.views.main.router.navigate("/problems", {
        props: {
          areaSelected: area,
        },
      });
    };
    const getTotalRoutes = computed(() => {
      if (gym.value != null) {
        const total = gym.value.problemcount;
        return total;
      }
      return 0;
    });
    const getOwnTickCount = computed(() => {
      if (profile.value.info != null) {
        // Count only unique ticks
        const problemsids = profile.value.info.ticked.map((tick) => tick.problemid);
        const distinctProblems = [...new Set(problemsids)];
        return distinctProblems.length;
      }
      return 0;
    });
    const getClimbedPercentage = computed(() => {
      const percentage =
        Math.round((getOwnTickCount.value / getTotalRoutes.value) * 1000) / 10;
      return percentage;
    });
    const onMyLogsClicked = () => f7.views.main.router.navigate("/mylogs");
    const onStatusBadgeClicked = () => f7.views.main.router.navigate("/problems");
    const openSearchTick = () => (dlgSearchTickOpen.value = true);
    const isSidePanelOpen = computed(() => {
      return store.state.ui.sidePanelOpen
    })
    const logout = () => {
      store.commit('setSidePanelOpen',false)
      accountService.goodOleLogout();
    };

    return {
      logout,
      isSidePanelOpen,
      profileLoaded,
      store,
      user,
      triesToday,
      ticksToday,
      gym,
      getTotalRoutes,
      onAreaSelected,
      getClimbedPercentage,
      onMyLogsClicked,
      onStatusBadgeClicked,
      openSearchTick,
      accounts,
      deleteAccount,
    };
  },
  components: {
    FloorMap,
    MyLogs,
    SearchProblemsSheet,
  },
};
</script>

<style></style>
