<template>
  <!-- Left panel with cover effect-->
   <div class="absolute w-4/5 h-full border border-black bg-white p-2 " style="z-index : 2000;" v-if="isSidePanelOpen">
        <h2>{{ $t('sidebar.menu') }}</h2>
        <div>
          <ul class="">
            <li class="my-1 py-1 border-b border-gray-300" @click="navigateToGyms">{{ $t("sidebar.gyms") }}</li>
            <li class="my-1 py-1 border-b border-gray-300" @click="logout">{{ $t("sidebar.logout") }}</li>
            <li class="my-1 py-1 border-b border-gray-300">v2.0beta1</li>
          </ul>
          <p class="mt-4">
            {{ $t('global.join') }}
            <div class="flex flex-row gap-2">
                <a class="block" href="https://github.com/jannunen/f7_problemator.git">
                <i class="f7-icons">logo_github</i>
                </a>
            </div>
          </p>
        </div>
   </div>
</template>

<script>
import { useStore } from "vuex";
import { computed, ref, onMounted } from "vue";
import { router } from '@js/auth/helpers';

export default {
  setup() {
    const store = useStore();
    const isSidePanelOpen = computed(() => {
      return store.state.ui.sidePanelOpen;
    });
    const logout = () => {
      store.commit("setSidePanelOpen", false);
      alert(' todo: logout')
    };
    const navigateToGyms = () => {
      store.commit("setSidePanelOpen", false);
      router.push("/gyms");
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
