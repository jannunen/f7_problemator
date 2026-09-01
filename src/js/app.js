import 'framework7/framework7-bundle.css';
import { installErrorReporting } from '@js/helpers/reportError'
import { f7 } from 'framework7-vue'
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
import { queryClient } from '@js/queryClient'
import { registerServiceWorker } from '@js/helpers/registerServiceWorker.js'



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
// Explicit client: the bare plugin call meant staleTime 0 and refetch on
// every window focus, which re-asked for everything constantly to cover for
// writes that invalidated nothing. See queryClient.js.
app.use(VueQueryPlugin, { queryClient });

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
// Last net: errors outside a component's render, and unhandled promise
// rejections, which no boundary sees. On a phone a silent failure is worse
// than anywhere else — there is no address bar to reload from.
installErrorReporting(app, (msg) => {
  try {
    f7.toast.create({ text: msg, closeTimeout: 4000, position: 'bottom' }).open()
  } catch {
    // Framework7 may not be ready during early startup; the console still has it.
  }
});

app.mount('#app');

// Register the workbox-generated worker so a deploy has something to hand
// off to — see helpers/registerServiceWorker.js for why this call was the
// missing piece, and helpers/update.js for the handover itself. Deferred to
// `load` so it never competes with the resources the first paint needs.
window.addEventListener('load', () => {
  registerServiceWorker()
});
