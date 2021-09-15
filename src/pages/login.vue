<template>
  <f7-page no-toolbar no-navbar no-swipeback login-screen v-cloak>
    <f7-login-screen-title>Problemator</f7-login-screen-title>
    <f7-block v-if="readyToShow"> Initializing... </f7-block>
    <f7-block v-else>
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
        <f7-block-footer
          >Some text about login information.<br />Lorem ipsum dolor sit amet, consectetur
          adipiscing elit.</f7-block-footer
        >
        <div class="flex flex-row justify-center " @click="login">
        <button class="my-2 flex flex-row justify-center self-center bg-blue-500 text-white py-2 px-4 w-1/2 btn btn-facebook" @click="login">
          <i class="fa fa-facebook mr-1"></i>
          Login with Facebook
        </button>
        </div>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script>
import { ref, onMounted } from "vue";
import { f7 } from "framework7-vue";
import { router } from "@js/auth/helpers";
import { accountService } from "@/js/auth/services";

export default {
  props: {
    f7router: Object,
  },
  setup() {
    const self = this;
    const email = ref("");
    const password = ref("");
    const readyToShow = ref(false);

    if (accountService.accountValue) {
      router.push("/");
    }
    const doLogin = () => {
      accountService.goodOleLogin(email.value, password.value);
    };
    onMounted(() => {});
    return {
      doLogin,
      email,
      password,
      login: accountService.login,
      readyToShow,
    };
  },
  methods: {
    signIn() {
      const self = this;

      f7.dialog.alert(`Username: ${self.username}<br>Password: ${self.password}`, () => {
        self.f7router.back();
      });
    },
  },
};
</script>
<style></style>
