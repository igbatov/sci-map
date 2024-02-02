<template>
  <div :class="$style.textSearch">
    <TextSearch />
  </div>
  <div :class="$style.wrapper">
    <div v-if="email">
      <div class="p-grid">
        <div class="p-col">
          {{ email }}
        </div>
      </div>
      <div class="p-grid">
        <Feedback />
        <EditMode />
        <span v-if="editModeOn">
          <CutPaste v-if="isNodeSelected" />
          <AddNode />
          <RemoveNode v-if="isNodeSelected" />
        </span>
        <AddPrecondition
          v-if="isNodeSelected"
          :clickedTitleId="clickedTitleId"
          @select-precondition-is-on="$emit('select-precondition-is-on')"
          @select-precondition-is-off="$emit('select-precondition-is-off')"
        />
        <MapChangeLog/>
        <button @click="signOut">Sign Out</button>
      </div>
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
import AddPrecondition from "./AddPrecondition";
import AddNode from "./AddNode";
import RemoveNode from "./RemoveNode";
import EditMode from "./EditMode";
import CutPaste from "@/components/menu/CutPaste";
import Feedback from "@/components/menu/Feedback";
import TextSearch from "@/components/menu/Textsearch";
import MapChangeLog from "@/components/menu/MapChangeLog";

export default {
  name: "Menu",
  components: {
    Feedback,
    CutPaste,
    AddNode,
    AddPrecondition,
    RemoveNode,
    EditMode,
    TextSearch,
    MapChangeLog,
  },
  props: {
    clickedTitleId: {
      type: String,
      required: true
    }
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
  top: 0;
  right: 0;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
}
.textSearch {
  position: fixed;
  display: flex;
  top: 0%;
  left: 0%;
  width: 30%;
  padding: 15px 20px;
  background: linear-gradient(rgba(120, 120, 120, 0.4), rgba(120, 120, 120, 0));
}
</style>
