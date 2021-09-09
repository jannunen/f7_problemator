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

/*
import LogRocket from 'logrocket';
LogRocket.init('7qbvoo/problemator');
*/
import commonTemplateFilters from './commonTemplateFilters.js'

// Init Framework7-Vue Plugin
Framework7.use(Framework7Vue);

// Init App
const app = createApp(App,{
  panel : {
    swipe : true,
  }
});
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime)

import store from '@js/store/store.js'
app.use(store)

// Register Framework7 Vue components
registerComponents(app);

import messages from './i18n/messages.js'
  
  // 2. Create i18n instance with options
  const i18n = createI18n({
    locale: 'fi', // set locale
    fallbackLocale: 'en', // set fallback locale
    messages, 
  })
  app.use(i18n)
 
app.use(vueTheStorages)


app.config.globalProperties.$filters = commonTemplateFilters

// Mount the app
app.mount('#app');