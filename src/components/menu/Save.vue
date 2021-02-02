<template>
  <button @click="save">Save</button>
</template>

<script>
import { useStore } from "@/store";
import api from "@/api/api";

export default {
  name: "Menu",
  setup() {
    const store = useStore();
    const user = store.state.user;

    return {
      save: () => api.saveMap(user.user, store.state.tree.tree)
    };
  }
};
</script>
