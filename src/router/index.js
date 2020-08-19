import Vue from "vue";
import VueRouter from "vue-router";
import App from "../App";
import store from "@/store";
import { GetRoot } from "@/store";
import { processNodeSelect } from "@/store/utils";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [{ path: "/:id", component: App }]
});

router.afterEach(async to => {
  if (!store.getters[GetRoot]) {
    return;
  }
  let nodeId = to.params.id;
  await processNodeSelect(nodeId);
});

export default router;
