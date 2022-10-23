<template>
    
    <div class="m-3">
    <h1 class="text-3xl text-white font-bold">Problemator</h1>
        
    <p>
        First of all, I am sorry for the long overdue update. There 
        has been a lot of going on. Please read through the following text.
        <br /><br />
        <h2 class="font-bold my-2">What's new?</h2>
        In this update, many of the old functionality has been stripped
        off and they will be rebuilt as we go. The app is rewritten 
        from scratch with <a href="https://vuejs.org/">Vue.js 3</a>, <a href="https://framework7.io/vue/">Framework7</a> and <a href="https://tailwindcss.com/">Tailwind</a>.
        New functionality will be added gradually and there will be a popup showing
        about new features.
        <br /><br />
        And there are some new features actually: 
        <ul class="text-left ml-8 list-disc">
        <li>Faster!</li>
        <li>Map based navigation</li>
        <li>Competition judging integrated</li>
        <li>Support for QR codes on problem tags (gyms who use this)</li>
        <li>Ability to have projects</li>
        <li>Better filtering (grades, walls, projects, climbed problems etc.)</li>
        </ul>
        <h2 class="font-bold my-2">Cookies</h2>
        And by the way, we <strong>do use</strong> cookies, as does almost
        every web app. We're not selling your soul to third parties. By
        logging in you accept our usage of cookies. We use cookies to
        track your climbing, and that's it.
        <br /><br />
        <h2 class="font-bold my-2">Read this carefully</h2>
        <div class="p-2 bg-red-600 opacity-80 border border-red-300 rounded-md text-white">
          <strong>Important!</strong>
          The easiest way is to use the same email address you used to
          login to the old version OR the same email you have
          associated to your Facebook login.
          <br /><br />
          If you cannot see your old ascents, open the menu (top right) and 
          choose "Import ticks". Fill in the field "email" and click "Send instructions". Then you will get
          an email to your old email address and by confirming the email address,
          you will get your old ticks back!

        </div>
        
         Now, please click the login or register button below.
    </p>
    <p-button class="btn-primary" @click="loginWithRedirect">{{ t('Login / Register') }}</p-button>
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
