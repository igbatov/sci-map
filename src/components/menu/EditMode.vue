<template>
  <div>
    <MenuButton v-if="!editModeOn" @click="on" style="height:35px">
      <img
        alt="icon"
        src="../../assets/images/switch-on.svg"
        style="width: 20px"
      />
      <span class="p-ml-2">edit map</span>
    </MenuButton>
    <MenuButton v-if="editModeOn" @click="off" style="height:35px;">
      <img
        alt="icon"
        src="../../assets/images/switch-off.svg"
        style="width: 20px"
      />
      <span class="p-ml-2">edit map</span>
    </MenuButton>
  </div>
</template>

<script>
import { actions, useStore } from "@/store";
import { computed } from "vue";
import MenuButton from "@/components/menu/MenuButton.vue";

export default {
  name: "EditMode",
  components: {
    MenuButton
  },
  setup() {
    const store = useStore();

    return {
      editModeOn: computed(() => store.state.editModeOn),
      on: () => {
        store.dispatch(`${actions.setEditMode}`, true);
      },
      off: () => {
        store.dispatch(`${actions.setEditMode}`, false);
      }
    };
  }
};
</script>
