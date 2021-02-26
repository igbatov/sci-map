<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
      <AddNode />
      <RemoveNode />
      <Save />
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
import AddNode from "./AddNode";
import RemoveNode from "./RemoveNode";
import Save from "./Save";

export default {
  name: "Menu",
  components: {
    AddNode,
    RemoveNode,
    Save
  },
  setup() {
    const store = useStore();
    const user = store.state.user;

    // user info
    const email = computed(() => (user.user ? user.user.email : null));

    return {
      email,
      // SignIn SignOut
      signIn: () => store.dispatch(`user/${userActions.signIn}`),
      signOut: () => store.dispatch(`user/${userActions.signOut}`)
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