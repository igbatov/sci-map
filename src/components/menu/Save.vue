<template>
  <button @click="save">Save</button>
</template>

<script>
import {actions, useStore} from "@/store";

export default {
  name: "Menu",
  setup() {
    const store = useStore();

    return {
      save: () => {
        store.dispatch(`${actions.saveMap}`);
      }
    };
  }
};
</script>
