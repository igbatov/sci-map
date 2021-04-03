<template>
  <button @mousedown.stop="toggleAddDialog">pin</button>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
  >
    <template #header>
      <h3>
        {{ `Choose parent from which pin will be visible` }}
      </h3>
    </template>

    <Listbox v-model="selectedParent" :options="parents" optionLabel="title" />

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
import Listbox from "primevue/listbox";
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions as pinActions } from "@/store/pin";

export default {
  name: "PinNode",
  components: {
    Dialog,
    Button,
    Listbox
  },
  setup() {
    const store = useStore();
    const treeState = store.state.tree;
    const addDialogVisible = ref(false);
    const selectedParent = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);
    const newNodeTitle = ref("");
    const parents = computed(() => {
      const selectedNodeParents = [];
      let currentParent = treeState.nodeRecord[treeState.selectedNodeId].parent;
      while (treeState.nodeRecord[currentParent.id].parent) {
        selectedNodeParents.push({
          title: currentParent.title,
          id: currentParent.id
        });
        currentParent = treeState.nodeRecord[currentParent.id].parent;
      }
      selectedNodeParents.push({ title: "root", id: 0 });
      return selectedNodeParents;
    });

    return {
      toggleAddDialog: () => {
        addDialogVisible.value = !addDialogVisible.value;
      },
      selectedParent,
      parents,
      add: () => {
        addDialogVisible.value = false;
        store.dispatch(`pin/${pinActions.AddPin}`, {
          parentId: selectedParent.value.id,
          nodeId: selectedNode.value.id
        });
        selectedParent.value = null;
      },
      cancelAdd: () => {
        addDialogVisible.value = false;
      },
      addDialogVisible,
      newNodeTitle
    };
  }
};
</script>
