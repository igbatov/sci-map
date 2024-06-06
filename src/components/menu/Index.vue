<template>
  <div :class="$style.wrapper">
    <div v-if="email" style="width:100%">
      <div style="position: absolute; right: 1.5rem; top:1.2rem;">
        <MenuButton @click="toggleUserMenu">
          <img
            alt="user"
            src="../../assets/images/menu.svg"
            style="width: 1.2rem"
          />
        </MenuButton>
        <PrimeMenu ref="menu" id="overlay_menu" :model="items" :popup="true" />
      </div>
      <div v-if="isWideScreen()" style="position: absolute; right: 5.3rem; top:1.2rem;">
        <Help />
      </div>
      <div v-if="isWideScreen()" style="position: absolute; right: 8.8rem; top:1.2rem;">
        <Feedback />
      </div>

      <div
          v-if="isWideScreen()"
          style="position: absolute; right:15rem; top:1.2rem;"
      >
        <ChangeLog
            @restore-select-new-parent-is-on="$emit('restore-select-new-parent-is-on')"
            @restore-select-new-parent-is-off="$emit('restore-select-new-parent-is-off')"
            :clickedTitleId="clickedTitleId"
        />
      </div>

      <EditMode v-if="isWideScreen()" :isNodeSelected="isNodeSelected" style="position: absolute; right: 20.5rem; top:1.2rem;" />

      <div v-if="editModeOn" style="position: absolute; right: 28.3rem; top:1.2rem;">
        <AddNode />
      </div>
      <div v-if="editModeOn" style="position: absolute; right: 34rem; top:1.2rem;">
        <RemoveNode />
      </div>
      <div
        v-if="editModeOn"
        style="position: absolute; right: 40.7rem; top:1.2rem;"
      >
        <CutPaste />
      </div>
    </div>
    <div v-else>
      <Button
        @click="signIn"
        style="position: absolute; right: 2rem; top: 1.2rem;"
        rounded
        size="small"
        icon="pi pi-sign-in"
        :label="isWideScreen() ? 'sign in' : ''"
      />
    </div>
  </div>
</template>

<script>
import { useStore } from "@/store";
import {computed, ref, useCssModule} from "vue";
import { actions as userActions } from "@/store/user";
import AddNode from "./AddNode";
import RemoveNode from "./RemoveNode";
import EditMode from "./EditMode";
import CutPaste from "@/components/menu/CutPaste";
import Feedback from "@/components/menu/Feedback";
import ChangeLog from "@/components/menu/ChangeLog.vue";
import MenuButton from "@/components/menu/MenuButton";
import Help from "@/components/menu/Help";
import PrimeMenu from "primevue/tieredmenu";
import Button from "primevue/button";
import {isWideScreen} from "@/components/helpers";

export default {
  name: "Menu",
  components: {
    Button,
    PrimeMenu,
    MenuButton,
    Feedback,
    Help,
    CutPaste,
    AddNode,
    RemoveNode,
    EditMode,
    ChangeLog
  },
  emits: ["restore-select-new-parent-is-on", "restore-select-new-parent-is-off"],
  props: {
    clickedTitleId: {
      type: String,
      required: true
    }
  },
  setup() {
    const $style = useCssModule()
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
    const editModeOn = computed(() => store.state.editModeOn);
    const items = computed(() => {
      const res = [
        {
          label: email.value,
        },
        {
          separator: true
        }]
      // if (!isWideScreen()) {
      //   res.push(...[
      //     {
      //       label: editModeOn.value ? "edit map is ON" : "edit map is OFF",
      //       icon: editModeOn.value ? "mdi mdi-power-on" : "mdi mdi-power-off",
      //       style: editModeOn.value ? "background-color: lightgrey" : "",
      //       command: () => {
      //         if (editModeOn.value) {
      //           store.dispatch(`${actions.setEditMode}`, false);
      //         } else {
      //           store.dispatch(`${actions.setEditMode}`, true);
      //         }
      //       }
      //     }
      //   ])
      //
      //   if (editModeOn.value) {
      //     res.push(...[
      //       {
      //
      //       }
      //     ])
      //   }
      // }
      res.push(...[
        {
          label: "email changes - "+(user.subscribePeriod ? user.subscribePeriod : 'weekly'),
          icon: "pi pi-eye",
          items: [
            {
              label: "weekly",
              icon: "pi pi-calendar",
              command: () => {
                store.dispatch(`user/${userActions.setSubscribePeriod}`, 'weekly');
              }
            },
            {
              label: "daily",
              icon: "pi pi-tablet",
              command: () => {
                store.dispatch(`user/${userActions.setSubscribePeriod}`, 'daily');
              }
            },
            {
              label: "on pause",
              icon: "pi pi-pause",
              command: () => {
                store.dispatch(`user/${userActions.setSubscribePeriod}`, 'on pause');
              }
            },
          ]
        },
        {
          label: "sign out",
          icon: "pi pi-sign-out",
          command: () => {
            store.dispatch(`user/${userActions.signOut}`);
          }
        },
      ]);
      return res;
    });
    return {
      isWideScreen,
      email,
      userPhotoURL,
      editModeOn,
      isNodeSelected: computed(() => {
        return !!store.state.tree.selectedNodeId && store.state.tree.selectedNodeId.length > 0
      }),
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
  z-index:20;
  position: fixed;
  display: flex;
  top: 0;
  right: 0;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  width: 70%;
}
.customSvgIcon {
  background: url("../../assets/images/user.svg");
  fill: red;
  height: 20px;
  width: 20px;
}
</style>
