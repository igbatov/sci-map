import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import router from "./router";
import { store, key } from "./store";
// primevue ui stuff
import "primevue/resources/themes/aura-light-green/theme.css"; //theme
import "primevue/resources/primevue.min.css"; //core css
import "primeicons/primeicons.css"; //icons
import "primeflex/primeflex.css";
import Tooltip from 'primevue/tooltip';
import VueDiff from 'vue-diff';
import 'vue-diff/dist/index.css';

createApp(App)
  .use(store, key)
  .use(router)
  .use(PrimeVue)
  .use(ConfirmationService)
  .use(ToastService)
  .use(VueDiff)
  .directive('tooltip', Tooltip)
  .mount("#app");
