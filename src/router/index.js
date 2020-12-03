import Vue from "vue";
import VueRouter from "vue-router";
import App from "../App";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [{ path: "/:id", component: App }]
});

router.afterEach(async to => {
  console.log(to.params.id);
});

export default router;
