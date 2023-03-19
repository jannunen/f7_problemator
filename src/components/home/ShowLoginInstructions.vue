<template>
    
    <div class="m-3">
    <h1 class="text-3xl text-white font-bold">Problemator</h1>
        
    <p>
        <br /><br />
        <div class="p-2 bg-red-600  border border-red-300 rounded-md text-white">
          <div class="font-bold text-2xl text-center">Do the SIGNUP</div>
          Don't try to login with your old credentials.
          <br />
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
const {
  loginWithRedirect,
} = useAuth0()
const { t } = useI18n()

</script>
