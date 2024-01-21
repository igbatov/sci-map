<template>
  <button @click="toggleDialog" :disabled="!selectedNodeTitle">-</button>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
  >
    <template #header>
      <h3>
        {{ `Remove ${selectedNodeTitle} and all its descendants?` }}
      </h3>
    </template>

    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        class="p-button-text"
        @click="cancel"
      />
      <Button label="Yes" icon="pi pi-check" @click="remove" />
    </template>
  </Dialog>
</template>

<script>
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions } from "@/store";
import {mutations as positionChangePermitMutations} from "@/store/position_change_permits";

export default {
  name: "RemoveNode",
  components: {
    Dialog,
    Button
  },
  setup() {
    const store = useStore();
    const addDialogVisible = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);

    return {
      selectedNodeTitle: computed(() =>
        selectedNode.value ? selectedNode.value.title : ""
      ),
      toggleDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      remove: () => {
        addDialogVisible.value = false;
        store.dispatch(`${actions.removeNode}`, selectedNode.value.id);
        store.commit(
            `positionChangePermits/${positionChangePermitMutations.ADD_NODES}`,
            store.state.tree.nodeRecord[selectedNode.value.id].parent.children.map((node)=>node.id)
        );
      },
      cancel: () => {
        addDialogVisible.value = false;
      },
      addDialogVisible
    };
  }
};
</script>
