import 'framework7/framework7-bundle.css';
import '../css/icons.css';
import '../css/app.less';
import '../css/tailwind.css';
import 'v-calendar/dist/style.css';
import { createAuth0 , } from '@auth0/auth0-vue';

import { createApp } from 'vue'

// Import F7 Bundle
import Framework7 from 'framework7/lite-bundle'

// Import F7-Vue Plugin Bundle (with all F7 components registered)
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle'
import store from "./store.js";
console.log(store)



// Init F7-Vue Plugin
Framework7.use(Framework7Vue);

// Import Main App component
import App from '../app.vue';
import messages from './i18n/messages'
import { createI18n } from 'vue-i18n'
import { jwtInterceptor } from '@js/helpers';

// enable interceptors for http requests
jwtInterceptor();
//errorInterceptor();

// Init App
const app = createApp(App);

// Register all Framework7 Vue components
registerComponents(app);
app.use(store);

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
})
app.use(i18n);

  const params = {
    domain: 'dev-gi6uwf0r.us.auth0.com',
    client_id: '9w5hh6NwrSZoQiLDRCoNHf7j3C9GGelz',
    audience : 'https://api.problemator.fi',
    redirect_uri: window.location.origin
  }
app.use( createAuth0(params));

// Mounte Vue App
app.mount('#app');
