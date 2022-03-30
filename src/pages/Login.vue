<template>
  <f7-page no-toolbar no-navbar no-swipeback login-screen>
    <f7-login-screen-title>Problemator login</f7-login-screen-title>
    <f7-list form>
      <f7-list-input
        label="Email"
        type="text"
        placeholder="Your email"
        v-model="username"
      ></f7-list-input>
      <f7-list-input
        label="Password"
        type="password"
        placeholder="Your password"
        v-model="password"
      ></f7-list-input>
    </f7-list>
    <f7-list>
      <f7-list-button @click="signIn">Sign In</f7-list-button>
      <f7-block-footer
        >Some text about login information.<br />Lorem ipsum dolor sit amet, consectetur
        adipiscing elit.</f7-block-footer
      >
    </f7-list>
  </f7-page>
</template>
<script setup>
import { f7 } from 'framework7-vue'
import { ref } from 'vue'
const props = defineProps({
  f7router: Object,
  f7route: Object,
})

console.log("@login")
const username = ref('username')
const password = ref('password')

const signIn = () => {
  const self = this
  f7.dialog.alert(`Username: ${username}<br>Password: ${password}`, () => {
    f7router.back()
  })
}
</script>
