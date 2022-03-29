<script setup>
import TodayHeader from '../components/TodayHeader.vue'
import { f7App } from 'framework7-vue';
import $ from 'dom7';
 import { useStore } from 'framework7-vue';
  import { watch, watchEffect } from 'vue'
 import { ref } from 'vue'
  import store from '../js/store.js'
  const dark = useStore('dark')
  const localDark = ref(true)
  const toggleDark = (newValue) => {
    const nowChecked = newValue.target.checked
    store.dispatch('setDark',nowChecked)
  }

    // Handles changing the dark/light theme. Seems a bit kludge, because it is. 
  watch(dark, (isDarkTheme, oldValue) => {
      const self = this;
      const $html = $('html');
      $html.removeClass('theme-dark theme-light');
      if (isDarkTheme) {
        $html.addClass(`theme-dark`);
      } else {
        $html.addClass(`theme-light`);
      }

  })
  
</script>

<template>
    <f7-page name="home">
    <f7-navbar title="Home">
        <f7-nav-right>
                <f7-toggle :checked="localDark" @change="toggleDark" />   
        </f7-nav-right>

    </f7-navbar>
    <!-- Page content -->
    <TodayHeader />
  </f7-page>
</template>