<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
      <button @click="signOut">Sign Out</button>
      <button @click="save">Save</button>
    </div>
    <button v-else @click="signIn">
      Sign In
    </button>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { computed } from "vue";
import { actions } from "@/store/user";
import api from "@/api/api";

export default {
  name: "Menu",
  setup() {
    const store = useStore();
    const user = store.state.user;
    const email = computed(() => (user.user ? user.user.email : null));

    return {
      email,
      signIn: () => store.dispatch(`user/${actions.signIn}`),
      signOut: () => store.dispatch(`user/${actions.signOut}`),
      save: () => api.saveMap(user.user, store.state.tree.tree)
    };
  }
};
</script>

<style module>
.wrapper {
  position: fixed;
  display: flex;
  justify-content: end;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
