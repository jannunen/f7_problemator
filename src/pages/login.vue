<template>
<f7-page no-toolbar no-navbar no-swipeback login-screen>
  <f7-login-screen-title>Framework7</f7-login-screen-title>
  <f7-list form>
    <f7-list-input
      label="Email"
      type="text"
      placeholder="Your email"
      v-model:value="email"
    ></f7-list-input>
    <f7-list-input
      label="Password"
      type="password"
      placeholder="Your password"
      v-model:value="password"
    ></f7-list-input>
  </f7-list>
  <f7-list>
    <f7-list-button @click="doLogin">Sign In</f7-list-button>
    <f7-block-footer>Some text about login information.<br>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</f7-block-footer>
  </f7-list>
</f7-page>
</template>
<script>
  import { ref, onMounted } from 'vue';
  import { f7 } from 'framework7-vue';
  import store from '@js/store'

  export default {
    props: {
      f7router: Object,
    },
    setup() {
        const self = this;
      const email = ref('');
      const password = ref('');

      const doLogin = () => {
        const payload = { email: email.value, password : password.value}
        store.dispatch('login',payload)
        .then((data) => {

            debugger
          // Save data to localStorage
          localStorage.jwt = data.jwt
          // If success, navigate to /home
          f7.views.main.router.navigate("/home")
        })
        .catch(err=> {
            f7.dialog.alert(JSON.stringify(err.response.data))

        })
      }
      return {
          doLogin,
          email,
          password,
      }

    },
    methods: {
      signIn() {
        const self = this;

        f7.dialog.alert(`Username: ${self.username}<br>Password: ${self.password}`, () => {
          self.f7router.back();
        });
      },
    },
  }
</script>