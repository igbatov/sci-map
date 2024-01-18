import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import PasswordLogin from "../views/PasswordLogin.vue";
import Home from "../views/Home.vue";
import Change from "../views/Change.vue";
import NotFound from "../views/NotFound.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/passwordLogin",
    component: PasswordLogin
  },
  {
    path: "/change/:id?",
    name: "change",
    component: Change
  },
  {
    path: "/:id?",
    name: "node",
    component: Home
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
