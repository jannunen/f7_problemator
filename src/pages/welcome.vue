<template>
<f7-page  no-toolbar no-navbar no-swipeback v-cloak>
  <f7-login-screen-title>Problemator</f7-login-screen-title>
  <div class="display-flex flex-direction-row align-content-center	margin justify-content-center">
    Initializing...
  </div>
</f7-page>
</template>
<script>
  import { ref, onMounted } from 'vue';
  import { f7 } from 'framework7-vue';

  export default {
    props: {
      f7router: Object,
    },
    setup() {
    },
    methods: {
    },
  }
</script>
<style >

</style>