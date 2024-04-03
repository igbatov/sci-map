import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import PasswordLogin from "../views/PasswordLogin.vue";
import Home from "../views/Home.vue";
import Change from "../views/Change.vue";
import UnsubscribeDigest from "../views/UnsubscribeDigest.vue";
import NodeDescription from "../views/NodeDescription.vue";
import NotFound from "../views/NotFound.vue";
import MobileWarning from "../views/MobileWarning.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/passwordLogin",
    component: PasswordLogin
  },
  {
    path: "/mobile_warning",
    component: MobileWarning
  },
  {
    path: "/node_description/:id?",
    name: "node_description",
    component: NodeDescription
  },
  {
    path: "/change/:id?",
    name: "change",
    component: Change
  },
  {
    path: "/unsubscribe_digest",
    name: "unsubscribe_digest",
    component: UnsubscribeDigest
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
