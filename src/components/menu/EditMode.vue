<template>
  <button v-if="editModeOn" @click="off">Back to view mode</button>
  <button v-if="!editModeOn" @click="on">Edit Map</button>
</template>

<script>
import {actions, useStore} from "@/store";
import {computed} from "vue";

export default {
  name: "EditMode",
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
