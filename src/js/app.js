import 'framework7/framework7-bundle.css';
import '../css/icons.css';
import '../css/app.less';
import '../css/tailwind.css';
import '../css/design-system.css';
import 'v-calendar/dist/style.css';
import { createApp } from 'vue'

// Import F7 Bundle
import Framework7 from 'framework7/lite-bundle'

// Import F7-Vue Plugin Bundle (with all F7 components registered)
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle'
import store from "./store.js";
import { VueQueryPlugin } from '@tanstack/vue-query'



// Init F7-Vue Plugin
Framework7.use(Framework7Vue);

// Import Main App component
import App from '../app.vue';
import messages from './i18n/messages'
import { createI18n } from 'vue-i18n'
import { jwtInterceptor, setLogoutHandler, setTokenRefreshHandler } from '@js/helpers';

// enable interceptors for http requests
jwtInterceptor();

// Wire up the 401 handler to use the store's logout action
setLogoutHandler(() => store.dispatch('logout'));

// Keep Vuex state in sync when the interceptor refreshes the token
setTokenRefreshHandler((token) => store.commit('setToken', token));
//errorInterceptor();

// Init App
const app = createApp(App);

// Register all Framework7 Vue components
registerComponents(app);
app.use(store);
app.use(VueQueryPlugin);

const supportedLocales = Object.keys(messages)
const savedLocale = localStorage.getItem('locale')
const browserLang = navigator.language?.split('-')[0]
const detectedLocale = (savedLocale && supportedLocales.includes(savedLocale))
  ? savedLocale
  : supportedLocales.includes(browserLang) ? browserLang : 'en'

const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: detectedLocale, // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
})
app.use(i18n);

// Mount Vue App
app.mount('#app');
