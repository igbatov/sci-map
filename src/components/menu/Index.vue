<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
      <EditMode v-if="isNodeSelected" />
      <span v-if="editModeOn">
        <CutPaste v-if="isNodeSelected" />
        <AddNode />
        <RemoveNode v-if="isNodeSelected" />
      </span>
      <PinNode v-if="isNodeSelected" />
      <UnpinNode v-if="isNodeSelected && isPinned" />
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
import PinNode from "./PinNode";
import AddNode from "./AddNode";
import RemoveNode from "./RemoveNode";
import EditMode from "./EditMode";
import UnpinNode from "@/components/menu/UnpinNode";
import CutPaste from "@/components/menu/CutPaste";

export default {
  name: "Menu",
  components: {
    CutPaste,
    UnpinNode,
    PinNode,
    AddNode,
    RemoveNode,
    EditMode,
  },
  setup() {
    const store = useStore();
    const user = store.state.user;

    // user info
    const email = computed(() => (user.user ? user.user.email : null));

    return {
      email,
      editModeOn: computed(() => store.state.editModeOn),
      isNodeSelected: computed(() => store.state.tree.selectedNodeId),
      isPinned: computed(
        () =>
          store.state.pin.pins[store.state.tree.selectedNodeId] !== undefined
      ),
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
  justify-content: flex-end;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
