<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
    </div>
    <button v-if="!email" @click="signIn">
      Sign In
    </button>
    <button v-else @click="signOut">
      Sign Out
    </button>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { computed } from "vue";
import { actions } from "@/store/user";

export default {
  name: "Menu",
  setup() {
    const store = useStore();
    const user = store.state.user;
    const email = computed(() => (user.user ? user.user.email : null));

    return {
      email,
      signIn: () => store.dispatch(`user/${actions.signIn}`),
      signOut: () => store.dispatch(`user/${actions.signOut}`)
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
