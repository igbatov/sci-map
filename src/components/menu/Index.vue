<template>
  <div :class="$style.textSearch">
    <TextSearch />
  </div>
  <div :class="$style.wrapper">
    <div v-if="email" style="width:100%">
      <div style="position: absolute; right: 2rem;">
        <MenuButton @click="toggleUserMenu">
          <img
            alt="user"
            src="../../assets/images/user.svg"
            style="width: 20px"
          />
        </MenuButton>
        <PrimeMenu ref="menu" id="overlay_menu" :model="items" :popup="true" />
      </div>
      <div style="position: absolute; right: 6.1rem;">
        <Feedback />
      </div>
      <EditMode style="position: absolute; right: 12.5rem;" />
      <div v-if="editModeOn" style="position: absolute; right: 20.6rem;">
        <AddNode />
      </div>
      <div v-if="editModeOn" style="position: absolute; right: 26.6rem;">
        <RemoveNode />
      </div>
      <div
        v-if="editModeOn && isNodeSelected"
        style="position: absolute; right: 33.6rem;"
      >
        <CutPaste v-if="isNodeSelected" />
      </div>
      <div
        v-if="editModeOn && isNodeSelected"
        style="position: absolute; right: 39.3rem;"
      >
        <MapChangeLog />
      </div>
    </div>
    <div v-else>
      <Button
        @click="signIn"
        style="position: absolute; right: 2rem;"
        rounded
        size="small"
        icon="pi pi-sign-in"
        label="sign in"
      />
    </div>
  </div>
</template>

<script>
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions as userActions } from "@/store/user";
import AddNode from "./AddNode";
import RemoveNode from "./RemoveNode";
import EditMode from "./EditMode";
import CutPaste from "@/components/menu/CutPaste";
import Feedback from "@/components/menu/Feedback";
import TextSearch from "@/components/menu/Textsearch";
import MapChangeLog from "@/components/menu/MapChangeLog";
import MenuButton from "@/components/menu/MenuButton.vue";
import PrimeMenu from "primevue/menu";
import Button from "primevue/button";

export default {
  name: "Menu",
  components: {
    Button,
    PrimeMenu,
    MenuButton,
    Feedback,
    CutPaste,
    AddNode,
    RemoveNode,
    EditMode,
    TextSearch,
    MapChangeLog
  },
  setup() {
    const store = useStore();
    const user = store.state.user;
    const menu = ref();

    // user info
    const userPhotoURL = computed(() =>
      user.user && user.user.photoURL
        ? user.user.photoURL
        : "../../assets/images/user.svg"
    );
    const email = computed(() => (user.user ? user.user.email : null));
    const items = computed(() => {
      return [
        {
          label: email.value,
          items: [
            {
              label: "sign out",
              icon: "pi pi-sign-out",
              command: () => {
                store.dispatch(`user/${userActions.signOut}`);
              }
            }
          ]
        }
      ];
    });
    return {
      email,
      userPhotoURL,
      editModeOn: computed(() => store.state.editModeOn),
      isNodeSelected: computed(() => store.state.tree.selectedNodeId),
      isPinned: computed(
        () =>
          store.state.pin.pins[store.state.tree.selectedNodeId] !== undefined
      ),
      // SignIn
      signIn: () => store.dispatch(`user/${userActions.signIn}`),
      // User Menu
      menu,
      toggleUserMenu: event => {
        menu.value.toggle(event);
      },
      items
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
  width: 70%;
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
