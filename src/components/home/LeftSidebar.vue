<template>
  <!-- Left panel with cover effect-->
  <f7-panel left cover theme-dark :opened="isSidePanelOpen">
    <f7-view>
      <f7-page>
        <f7-navbar :title="$t('sidebar.menu')"></f7-navbar>
        <f7-block>
          <f7-list class="my-0 p-0">
            <f7-list-item @click="navigateToGyms">{{ $t("sidebar.gyms") }}</f7-list-item>
            <f7-list-item @click="logout">{{ $t("sidebar.logout") }}</f7-list-item>
            <f7-list-item>v2.0beta1</f7-list-item>
          </f7-list>
          <p class="mt-4">
            {{ $t('global.join')}}
            <div class="flex flex-row gap-2">
                <a class="block" href="https://github.com/jannunen/f7_problemator.git">
                <i class="f7-icons">logo_github</i>
                </a>
            </div>
          </p>
        </f7-block>
      </f7-page>
    </f7-view>
  </f7-panel>
</template>

<script>
import { useStore } from "vuex";
import { computed, ref, onMounted } from "vue";
import { accountService } from "@js/auth/services";
import { f7, f7ready } from "framework7-vue";
export default {
  setup() {
    const store = useStore();
    const isSidePanelOpen = computed(() => {
      return store.state.ui.sidePanelOpen;
    });
    const logout = () => {
      store.commit("setSidePanelOpen", false);
      accountService.goodOleLogout();
    };
    const navigateToGyms = () => {
      store.commit("setSidePanelOpen", false);
      f7.views.main.router.navigate("/gyms");
    };
    return {
      isSidePanelOpen,
      navigateToGyms,
      logout,
    };
  },
};
</script>

<style></style>
