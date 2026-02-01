import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Leaflet CSS */
import 'leaflet/dist/leaflet.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

import './firebase';

const app = createApp(App)
  .use(IonicVue)
  .use(router);

// Configuration de la Status Bar
const configureStatusBar = async () => {
  try {
    // Rendre la status bar overlay (transparente)
    await StatusBar.setOverlaysWebView({ overlay: false });
    
    // Style de la status bar (dark content sur fond clair)
    await StatusBar.setStyle({ style: Style.Light });
    
    // Couleur de fond (blanc avec transparence)
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    
    // Configuration du clavier
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
  } catch (error) {
    console.log('Status Bar not available:', error);
  }
};

router.isReady().then(() => {
  app.mount('#app');
  configureStatusBar();
});
