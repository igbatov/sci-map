import { createRouter, createWebHistory } from "vue-router";
import App from "../App";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [{ path: "/:id", component: App }]
});

router.afterEach(async to => {
  console.log(to.params.id);
});

export default router;
