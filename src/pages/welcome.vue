<template>
<f7-page  no-toolbar no-navbar no-swipeback v-cloak>
  <f7-login-screen-title>Problemator</f7-login-screen-title>
  <div class="display-flex flex-direction-row align-content-center	margin justify-content-center">
    Initializing...
  </div>
</f7-page>
</template>
<script>
import {onMounted} from 'vue'
import { useRouter, useRoute } from 'vue-router'

  export default {
    props: {
      f7router: Object,
    },
    setup() {
      const router =  useRouter()
      onMounted(() => {

        router.push("/")

      })
    },
    methods: {
    },
  }
</script>
<style >

</style>