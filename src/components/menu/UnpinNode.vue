<template>
  <button @click="unpin">unpin</button>
</template>

<script>
import { useStore } from "@/store";
import { actions as pinActions } from "@/store/pin";
import api from "@/api/api";

export default {
  name: "UnpinNode",
  setup() {
    const store = useStore();

    return {
      unpin: () => {
        store.dispatch(
          `pin/${pinActions.RemovePin}`,
          store.state.tree.selectedNodeId
        );
        api.savePins(store.state.user.user, store.state.pin.pins);
      }
    };
  }
};
</script>
