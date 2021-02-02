import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import router from "./router";
import { store, key } from "./store";
// primevue ui stuff
import "primevue/resources/themes/saga-blue/theme.css"; //theme
import "primevue/resources/primevue.min.css"; //core css
import "primeicons/primeicons.css"; //icons

createApp(App)
  .use(store, key)
  .use(router)
  .use(PrimeVue)
  .mount("#app");
