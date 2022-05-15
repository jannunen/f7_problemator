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
import { accountService } from '@js/auth/accountservice'

import { watch, ref } from 'vue'
import store from '../js/store.js'
import { f7, useStore } from 'framework7-vue'
/*
 * This component is a kludge. Framework7 does not use authGuard for its
 * first page, for whatever reason. This just moves the app beyond
 * the first page, so that authGuard catches and the normal login
 * functionality will work.
 */
const props = defineProps({
  f7router: Object,
})
import { onMounted } from 'vue'
const { loginWithRedirect, getAccessTokenSilently, logout, user, isAuthenticated } = useAuth0();
const loginScreenOpened = ref(false)
const userStore = useStore('user')
const email = ref('')
const password = ref('')
const errorNotification = ref(null)

watch(isAuthenticated, async (newValue, oldValue) => {
  if (newValue === true) {
    // Get token and send to api
    const token = await getAccessTokenSilently();
    const ret = await store.dispatch('setToken',token)
    console.log('store -> getProfile')
    store.dispatch('getProfile')
    f7.views.main.router.navigate({url : '/home'  });
  }
})
/*
const beforeShow = () => {
    debugger
  if (isAuthenticated.value) {
    console.log("nav to home")
    if (userStore.value == null) {
      store.dispatch('setUser',user)
    } 
    props.f7router.navigate({url : "/home/"})
  }
}
*/
const beforeUnmount = () => {
    if (errorNotification.value != null) {
        errorNotification.value.destroy()
    }
}
const signIn = () => {
  /*
  accountService.goodOleLogin(email.value, password.value).then((ret) => {
    if (ret === false) {
      if (errorNotification.value == null) {
        errorNotification.value = f7.notification.create({
          icon: '<i class="icon icon-f7"></i>',
          title: 'Login failed',
          subtitle: 'Empty username/password or incorrect info',
          closeTimeout: 5000,
        })
      }
      errorNotification.value.open()
    } else {
      props.f7router.navigate('/home/')
    }
  })
  */
}
onMounted(() => {
  /*
  const ret = accountService.checkIfLogin().then(() => {
    const account = accountService.accountValue
    if (!account) {
      loginScreenOpened.value = true
    } else {
      props.f7router.navigate('/home/')
    }
  })
  */
})
</script>
