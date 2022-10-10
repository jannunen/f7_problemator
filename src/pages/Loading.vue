<template>
  <f7-page
    no-toolbar
    no-navbar
    no-swipeback
    login-screen
    @vnode-before-unmount="beforeUnmount"
    @page:beforein="beforeShow"
  >
    <div v-if="user != null">
        <div v-if="!user.email_verified">
          You need to verify your email before you can use the app
        </div>
    </div>
    <f7-list-button @click="loginWithRedirect()">Tää on sellainen auth0login</f7-list-button>"
    user: {{ user }}
    <f7-list-button @click="logout()">Logout</f7-list-button>"
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
import { useAuth0 } from '@auth0/auth0-vue';

import { watch, ref } from 'vue'
import store from '../js/store.js'
import { onMounted } from 'vue'
import { f7 } from 'framework7-vue'
/*
 * This component is a kludge. Framework7 does not use authGuard for its
 * first page, for whatever reason. This just moves the app beyond
 * the first page, so that authGuard catches and the normal login
 * functionality will work.
 */
const props = defineProps({
  f7router: Object,
})
const { loginWithRedirect, getAccessTokenSilently, logout, user, isAuthenticated } = useAuth0();
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
