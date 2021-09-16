<template>
  <f7-page no-toolbar no-navbar no-swipeback login-screen v-cloak>
    <div class="flex flex-row justify-center">
      <img
        src="https://www.problemator.fi/problemator/assets/images/problemator_logo_new_small.png"
      />
    </div>
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
        <button :class="getLoginButtonClasses" @click="doLogin">Sign In</button>
        <div class="flex flex-row justify-center" @click="login">
          <button
            class="my-2 flex flex-row justify-center self-center bg-blue-500 text-white py-2 px-4 w-1/2 btn btn-facebook"
            @click="login"
          >
            <i class="fa fa-facebook mr-1"></i>
            Login with Facebook
          </button>
        </div>
        <f7-block-footer>
          This is Problemator. It's made by a climber for climbers. This is made as a side
          project so you will experience bugs, bad UX and such. Instead of complaining,
          fork the code from Github, make it better and create a pull request.
          <br />
          <br />
          After all, we don't treat you as a commodity.
        </f7-block-footer>
      </f7-list>
    </f7-block>
  </f7-page>
</template>
<script>
import { computed, ref, onMounted } from "vue";
import { f7 } from "framework7-vue";
//import { router } from "@js/auth/helpers";
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
      debugger
      f7.views.main.router.navigate("/");
    }
    const doLogin = () => {
      accountService.goodOleLogin(email.value, password.value)
      .then(ret => {
        window.location.reload()
      })
    };
    const getLoginButtonClasses = computed(() => {
      if (email.value != "" && password.value != "") {
        return {
          "px-8": true,
          "py-3": true,
          "bg-blue-500": true,
          "text-white": true,
        };
      }
      return {};
    });
    onMounted(() => {});
    return {
      doLogin,
      email,
      getLoginButtonClasses,
      password,
      login: accountService.login,
      readyToShow,
    };
  },
};
</script>
<style></style>
