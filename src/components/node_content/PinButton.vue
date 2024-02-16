<template>
  <PinIcon @click="clickPin"/>
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
import {actions, useStore} from "@/store";
import { computed, ref } from "vue";
import { actions as pinActions } from "@/store/pin";
import api from "@/api/api";
import PinIcon from "@/components/node_content/PinIcon.vue";
import {useConfirm} from "primevue/useconfirm";

export default {
  name: "PinButton",
  components: {
    PinIcon,
    Dialog,
    Button,
    Listbox
  },
  setup() {
    const store = useStore();
    const confirm = useConfirm();
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
      clickPin: async () => {
        if (!(store.state.user && store.state.user.user && !store.state.user.user.isAnonymous)) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {confirm, message:"Please authorize to pin nodes"});
          return
        }
        if (
          store.state.pin.pins[store.state.tree.selectedNodeId] !== undefined
        ) {
          store.dispatch(
            `pin/${pinActions.RemovePin}`,
            store.state.tree.selectedNodeId
          );
          api.savePins(store.state.user.user, store.state.pin.pins);
        } else {
          addDialogVisible.value = !addDialogVisible.value;
        }
      },
      selectedParent,
      parents,
      add: () => {
        addDialogVisible.value = false;
        store.dispatch(`pin/${pinActions.AddPin}`, {
          parentId: selectedParent.value.id,
          nodeId: selectedNode.value.id
        });
        api.savePins(store.state.user.user, store.state.pin.pins);
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
