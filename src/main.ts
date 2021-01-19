import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { store as treeStore, key } from "./store/tree";

createApp(App)
  .use(treeStore, key)
  .use(router)
  .mount("#app");
