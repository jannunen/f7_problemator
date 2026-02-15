<template>
  <f7-page
    no-toolbar
    no-navbar
    no-swipeback
    login-screen
    @vnode-before-unmount="beforeUnmount"
    @page:beforein="beforeShow"
  >
    <f7-login-screen-title>Framework7</f7-login-screen-title>
    <f7-list form>
      <f7-list-input
        label="Email"
        type="text"
        placeholder="Your email"
        :value="email"
        @input="email = $event.target.value"
      ></f7-list-input>
      <f7-list-input
        label="Password"
        type="password"
        placeholder="Your password"
        :value="password"
        @input="password = $event.target.value"
      ></f7-list-input>
    </f7-list>
    <f7-list>
      <f7-list-button @click="signIn">Sign In</f7-list-button>
      <f7-block-footer
        >Read our Terms and License agreement.<br />&copy; Cave Oy</f7-block-footer
      >
    </f7-list>
  </f7-page>
</template>
<script setup>
import { ref } from 'vue'
import store from '../js/store.js'
import { onMounted } from 'vue'
import { f7 } from 'framework7-vue'

const props = defineProps({
  f7router: Object,
})
const email = ref('')
const password = ref('')
const errorNotification = ref(null)

const beforeUnmount = () => {
    if (errorNotification.value != null) {
        errorNotification.value.destroy()
    }
}
const signIn = () => {
}
onMounted(() => {
})
</script>
