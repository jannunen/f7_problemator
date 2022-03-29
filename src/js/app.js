//import Framework7 from './framework7-custom.js';
import { createI18n } from "vue-i18n";

import '../css/framework7-custom.less';
import '../css/icons.css';
import '../css/app.less';
import '../css/tailwind.css';

//import routes from './routes.js';
import store from './store.js';
//import App from '../app.f7.jsx';

import { createApp } from 'vue'

// Import F7 Bundle
import Framework7 from 'framework7/lite-bundle'

// Import F7-Vue Plugin Bundle (with all F7 components registered)
import Framework7Vue, { registerComponents } from 'framework7-vue/bundle'

// Init F7-Vue Plugin
Framework7.use(Framework7Vue);

// Import Main App component
import App from '../app.vue';

// Init App
const app = createApp(App);

// Register all Framework7 Vue components
registerComponents(app);

// Mounte Vue App
app.mount('#app');

// eslint-disable-next-line
/*
const app = new Framework7({
  name: 'Backlogger', // App name
  theme: 'auto', // Automatic theme detection
  el: '#app', // App root element
  component: App, // App main component
  store,
  routes,
  i18n,
  // Register service worker (only on production build)
  serviceWorker:
    process.env.NODE_ENV === 'production'
      ? {
          path: '/service-worker.js',
        }
      : {},
});
window.i18n = i18n
*/
