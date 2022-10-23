<template>
    
    <div class="m-3">
    <h1 class="text-3xl text-white font-bold">Problemator</h1>
        
    <p>
        First of all, I am sorry for the long overdue update. There 
        has been a lot of going on. Please read through the following text.
        <br /><br />
        <h2 class="font-bold my-2">Read this carefully</h2>
        <div class="p-2 bg-red-600 opacity-80 border border-red-300 rounded-md text-white">
          <strong class="text-lg"> Do NOT use the old login</strong>
          Sign up again with the same email you used before
          OR use Facebook/Google login after clicking login.
          <br /><br />
        </div>
    </p>
    <p-button class="btn-primary" @click="loginWithRedirect">{{ t('Login / Register') }}</p-button>
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
