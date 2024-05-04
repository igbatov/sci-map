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
    <MenuButton v-if="editModeOn" @click="off" style="height:35px;" bg-color="#03dbfc;">
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
import {useToast} from "primevue/usetoast";

export default {
  name: "EditMode",
  components: {
    MenuButton
  },
  props: {
    isNodeSelected: {
      type: Boolean,
      required: true
    },
  },
  setup(props) {
    const store = useStore();
    const toast = useToast();

    return {
      editModeOn: computed(() => store.state.editModeOn),
      on: () => {
        if (props.isNodeSelected) {
          store.dispatch(`${actions.setEditMode}`, true);
        } else {
          toast.add({
            severity: "info",
            summary: "Please, select node you want to edit",
            life: 2000
          });
        }
      },
      off: () => {
        store.dispatch(`${actions.setEditMode}`, false);
      }
    };
  }
};
</script>
