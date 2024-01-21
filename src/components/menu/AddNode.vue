<template>
  <button @click="toggleAddDialog">+</button>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
      <h3>
        {{
          selectedNodeTitle
            ? `Add subsection to ${selectedNodeTitle}`
            : `Add section`
        }}
      </h3>
    </template>

    <Input type="text" v-model="newNodeTitle" />

    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        class="p-button-text"
        @click="cancelAdd"
      />
      <Button label="Yes" icon="pi pi-check" @click="add" />
    </template>
  </Dialog>
</template>

<script>
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Input from "primevue/inputtext";
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions } from "@/store";
import { mutations as positionChangePermitMutations } from "@/store/position_change_permits";

export default {
  name: "AddNode",
  components: {
    Dialog,
    Button,
    Input
  },
  setup() {
    const store = useStore();
    const addDialogVisible = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);
    const newNodeTitle = ref("");

    return {
      selectedNodeTitle: computed(() =>
        selectedNode.value ? selectedNode.value.title : ""
      ),
      toggleAddDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      add: async () => {
        const newNodeID = await store.dispatch(`${actions.createNode}`, {
          parentID: selectedNode.value ? selectedNode.value.id : 0,
          title: newNodeTitle.value
        });
        store.commit(
            `positionChangePermits/${positionChangePermitMutations.ADD_NODES}`,
            [newNodeID, ...store.state.tree.nodeRecord[selectedNode.value.id].node.children.map((node)=>node.id)]
        );
        newNodeTitle.value = "";
        addDialogVisible.value = false;
      },
      cancelAdd: () => {
        newNodeTitle.value = "";
        addDialogVisible.value = false;
      },
      addDialogVisible,
      newNodeTitle
    };
  }
};
</script>
