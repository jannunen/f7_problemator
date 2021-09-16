<template>
  <f7-app v-bind="f7params">
    <left-sidebar></left-sidebar>

    <!-- Your main view, should have "view-main" class -->
    <f7-view :main="true" class="safe-areas" url="/" v-cloak> </f7-view>
  </f7-app>
</template>
<script>
import { computed, ref, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";
import { useStore } from "vuex";

import { accountService } from "@js/auth/services";
import LeftSidebar from '@components/home/LeftSidebar.vue'

import { createLocal, createSession } from "the-storages";
import { routes } from "@js/auth/helpers";

export default {
  setup(props, context) {
    const account = ref(null);
    accountService.account.subscribe((x) => (account.value = x));
    // Framework7 Parameters
    const f7params = {
      name: "Problemator", // App name
      theme: "auto", // Automatic theme detection
      routes,
      view: {
        stackPages : true,
        browserHistory : false,
      },
      // Register service worker (only on production build)
      serviceWorker:
        process.env.NODE_ENV === "production"
          ? {
              path: "/service-worker.js",
            }
          : {},
    };
    const self = this;
    const store = useStore();

    onMounted(() => {
      f7ready(() => {
        const mirror = createLocal(); // create localStorage; createSession is sessionStorage
        const storage = mirror._prx;
        // Filters are being fetched from the storage here, and they
        // are set into store. When the filters are updated, they are
        // both updated in the store and to the localStorage, so that
        // they will survive through reloads and stuff.
        // BUt they are stored in the store, so that the reactive properties stay
        //localStorage.clear();
        if (mirror.filters != null) {
          if (mirror.filters.gradeMin != null) {
            //storage.set('filters',{...mirror.get('filters'),['gradeMin'] : 'min', ['gradeMax'] : 'max'})
            store.commit("setFilterGradeMin", mirror.filters.gradeMin);
          }
          if (mirror.filters.gradeMax != null) {
            store.commit("setFilterGradeMax", mirror.filters.gradeMax);
          }
          if (mirror.filters.styles == null) {
            store.commit("setFilterStyles", mirror.filters.styles);
          }
          if (mirror.filters.sort == null) {
            //storage.set('filters',{...mirror.get('filters'),['sort'] : 'sector_asc'})
          }
        }
      });
    });
    const isSidePanelOpen = computed(() => {
      return store.state.ui.sidePanelOpen;
    });
    return {
      isSidePanelOpen,
      f7params,
      account,
    };
  },
  components : {
    LeftSidebar,
  }
};
</script>
