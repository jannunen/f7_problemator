// Import Vue
import { createApp } from 'vue';

// Import Framework7
import Framework7 from 'framework7/lite-bundle';

// Import Framework7-Vue Plugin
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle';

// Import Framework7 Styles
import 'framework7/framework7-bundle.css';


// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.scss';

// Import App Component
import App from '../components/app.vue';
import vueTheStorages from 'vue-the-storages'


//import VueI18n from 'vue-i18n'
import { createI18n } from 'vue-i18n'

import { accountService } from '@js/auth/services'
/*
import LogRocket from 'logrocket';
LogRocket.init('7qbvoo/problemator');
*/
import commonTemplateFilters from './commonTemplateFilters.js'
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import store from '@js/store/store.js'
import messages from './i18n/messages.js'

// Init Framework7-Vue Plugin
Framework7.use(Framework7Vue);
import { initFacebookSdk, jwtInterceptor, errorInterceptor } from '@js/auth/helpers';
//import { router } from '@js/auth/helpers'
// enable interceptors for http requests
jwtInterceptor();
errorInterceptor();

dayjs.extend(relativeTime)

// 2. Create i18n instance with options
const i18n = createI18n({
  locale: 'fi', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages,
})

// Check if account info is saved..
if (localStorage.account != null) {
  try {
    const account = JSON.parse(localStorage.account)
    if (account != null) {
      accountService.update(account)
    }
  } catch (e) {

  }
}
const app = createApp(App)

// Register Framework7 Vue components
registerComponents(app);
//app.use(router)
app.config.globalProperties.$filters = commonTemplateFilters

app.use(vueTheStorages)
app.use(i18n)
app.use(store)

const startApp = () => {
  app.mount('#app');
}

// wait for facebook sdk to start app
initFacebookSdk().then((foo) => {
  startApp();
});