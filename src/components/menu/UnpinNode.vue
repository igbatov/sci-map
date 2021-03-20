<template>
  <button @click="unpin">unpin</button>
</template>

<script>
import { useStore } from "@/store";
import { actions as pinActions } from "@/store/pin";

export default {
  name: "UnpinNode",
  setup() {
    const store = useStore();

    return {
      unpin: () => {
        store.dispatch(`pin/${pinActions.RemovePin}`, store.state.tree.selectedNodeId);
      },
    };
  }
};
</script>
