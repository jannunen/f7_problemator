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

//import VueI18n from 'vue-i18n'
import { createI18n } from 'vue-i18n'


// Init Framework7-Vue Plugin
Framework7.use(Framework7Vue);

// Init App
const app = createApp(App);


// Register Framework7 Vue components
registerComponents(app);

import messages from './i18n/messages.js'
console.log(messages)
  
  // 2. Create i18n instance with options
  const i18n = createI18n({
    locale: 'fi', // set locale
    fallbackLocale: 'en', // set fallback locale
    messages, 
  })
  app.use(i18n)

// Mount the app
app.mount('#app');