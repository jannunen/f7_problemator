<template>
  <f7-page name="gyms">
    <f7-navbar :title="$t('gyms.page_title')" :back-link="$t('global.back')"> </f7-navbar>
    <f7-block>
      <f7-input :label="$t('gyms.search_for_gyms')" class="px-2 py-2" :outline="true" v-model:value="gymSearchText" type="text" :placeholder="$t('gyms.search_title')" clear-button ></f7-input>
    </f7-block>
    <f7-list media-list class="search-list searchbar-found">
      <f7-list-item
        v-for="gym in gymsSorted"
        :key="gym.id"
        :link="`/gyms/` + gym.id"
        :value="gym.name"
        @click="enterGym(gym)"
      >
        <template #title>
          <div class="font-bold">{{ gym.name }}</div>
        </template>
        <template #subtitle>
          <div>{{ getSubTitle(gym) }}</div>
        </template>
        <template #text>
          <div v-html="convertDescr(gym.descr)"></div>
        </template>
      </f7-list-item>
    </f7-list>
  </f7-page>
</template>

<script>
import { f7, f7ready } from "framework7-vue";
import { onMounted, computed, ref } from "vue";
import { useStore } from "vuex";
import { router } from "@js/auth/helpers";

export default {
  setup() {
    const store = useStore();
    const gymSearchText= ref("") 

    onMounted(() => {
      store.dispatch("fetchGyms");
    });
    const getSubTitle = (gym) => {
      let str = "";
      if (gym.city != null) {
        str += gym.city + ", ";
      }
      str += gym.country;
      if (gym.continent != null) {
        str += ` (` + gym.continent + `)`;
      }
      return str;
    };
    const gyms = computed(() => store.state.gyms);
    const gymsSorted = computed(() => {
      let sortedGyms = gyms.value.sort((a, b) => a.name.localeCompare(b.name));
      // Check if search text is applied
      if (gymSearchText.value != "") {

          sortedGyms = sortedGyms.filter(gym => gym.name.toLowerCase().indexOf(gymSearchText.value.toLowerCase()) != -1)
      }
      return sortedGyms
    });
    const convertDescr = (descr) => {
      if (descr == null) {
        return "";
      }
      // Convert line change to br
      return descr.replace("\n", "<br />");
    };
    const enterGym = (gym) => {
      localStorage.gymid = gym.id;
      router.push("/");
    };
    return {
      gyms,
      gymsSorted,
      convertDescr,
      gymSearchText,
      getSubTitle,
      enterGym,
    };
  },
  components: {},
};
</script>

<style></style>
