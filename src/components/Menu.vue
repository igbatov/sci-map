<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
      <button @click="add">+</button>
      <button @click="save">Save</button>
      <button @click="signOut">Sign Out</button>
    </div>
    <button v-else @click="signIn">
      Sign In
    </button>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { computed } from "vue";
import { actions as userActions } from "@/store/user";
import { mutations as treeMutations } from "@/store/tree";
import api from "@/api/api";

export default {
  name: "Menu",
  setup() {
    const store = useStore();
    const user = store.state.user;
    const email = computed(() => (user.user ? user.user.email : null));

    return {
      email,
      signIn: () => store.dispatch(`user/${userActions.signIn}`),
      signOut: () => store.dispatch(`user/${userActions.signOut}`),
      save: () => api.saveMap(user.user, store.state.tree.tree),
      add: () => store.dispatch(`tree/${treeMutations.ADD_NODE}`)
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
