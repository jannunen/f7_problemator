<template>
    
    <div class="m-3">
    <h1 class="text-3xl text-white font-bold">Problemator</h1>
        
    <p>
        <br /><br />

        <div class="p-3 bg-sky-600  border border-sky-300 rounded-md text-white w-4/5 mx-auto ">
          <div class="font-bold text-2xl text-center">Please signup</div>
              If you have existing credentials, they don't work anymore, but the signup will revive them.
        </div>

      <div class="flex justify-center items-center">
      <img :src="logo" alt="Problemator logo" class="w-48" />
      </div>
    </p>
    <p-button class="btn-primary" @click="loginWithRedirect">{{ t('Login / Signup') }}</p-button>
        <h2 class="font-bold my-2">Cookie policy</h2>
        And by the way, we <strong>do use</strong> cookies, as does almost
        every web app. We're not selling your soul to third parties. By
        logging in you accept our usage of cookies. We use cookies to
        track your climbing, and that's it. If you don't want to use 
        cookies, the app will not work. 
        <br /><br />
    </div>
    
</template>
<script setup>
import PButton from '@components/PButton.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useI18n } from 'vue-i18n'
import logo from '../../assets/images/logo.png'
const {
  loginWithRedirect,
} = useAuth0()
const { t } = useI18n()

</script>
<style></style>
