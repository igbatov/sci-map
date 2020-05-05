import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;

/**
 * Hides an HTML element, keeping the space it would have used if it were visible (css: Visibility)
 */
const update = (el, binding) =>
  (el.style.visibility = binding.value ? "hidden" : "");
Vue.directive("hide", {
  bind: update,
  update: update
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
