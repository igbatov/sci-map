import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import Home from "../views/Home.vue";
import NotFound from "../views/NotFound.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/:id?",
    name: "node",
    component: Home
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound,
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
