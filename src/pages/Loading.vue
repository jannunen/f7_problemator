<template>
  <f7-page
    v-if="loginScreenOpened"
    no-toolbar
    no-navbar
    no-swipeback
    login-screen
    @vnode-before-unmount="beforeUnmount"
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
import { accountService } from '@js/auth/accountservice'
import { ref } from 'vue'
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
import { onMounted } from 'vue'
const loginScreenOpened = ref(false)
const email = ref('')
const password = ref('')
const errorNotification = ref(null)
const beforeUnmount = () => {
    if (errorNotification.value != null) {
        errorNotification.value.destroy()
    }
}
const signIn = () => {
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
}
onMounted(() => {
  const ret = accountService.checkIfLogin().then(() => {
    const account = accountService.accountValue
    if (!account) {
      loginScreenOpened.value = true
    } else {
      props.f7router.navigate('/home/')
    }
  })
})
</script>
