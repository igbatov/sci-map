<template>
  <MenuButton @click="toggleDialog" :disabled="!selectedNodeTitle">
    <img
      alt="icon"
      src="../../assets/images/remove-off.svg"
      style="width: 20px"
    />
    <span class="p-ml-2">delete</span>
  </MenuButton>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
  >
    <template #header>
      <h3>
        {{ `Remove "${selectedNodeTitle}" and all its descendants?` }}
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

<script lang="ts">
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useStore, actions } from "@/store";
import { computed, ref } from "vue";
import { mutations as positionChangePermitMutations } from "@/store/position_change_permits";
import MenuButton from "@/components/menu/MenuButton.vue";
import { mutations as treeMutations } from "@/store/tree";
import { useToast } from "primevue/usetoast";
import { getArrayDiff, idToLink } from "../helpers";

export default {
  name: "RemoveNode",
  components: {
    MenuButton,
    Dialog,
    Button
  },
  setup() {
    const store = useStore();
    const toast = useToast();
    const addDialogVisible = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);

    return {
      selectedNodeTitle: computed(() =>
        selectedNode.value ? selectedNode.value.title : ""
      ),
      toggleDialog: () => {
        const nodeID = selectedNode.value.id;

        // collect all children IDs recursively
        let stack = [nodeID];
        const allChildrenIDs = [];
        while (stack.length > 0) {
          const id = stack.pop();
          allChildrenIDs.push(id);
          stack.push(
            ...store.state.tree.nodeRecord[id].node.children.map(
              node => node.id
            )
          );
        }

        // collect all nodes where nodeID or its children were set as preconditions for nodes outside allChildrenIDs
        stack = [nodeID];
        const usedByNodes = {} as Record<string, Array<string>>;
        while (stack.length > 0) {
          const id = stack.pop();
          const [added, removed] = getArrayDiff(
            allChildrenIDs,
            store.state.precondition.reverseIndex[id]
          );
          if (store.state.precondition.reverseIndex[id] && added.length > 0) {
            usedByNodes[id] = added;
          }
          stack.push(
            ...store.state.tree.nodeRecord[id].node.children.map(
              node => node.id
            )
          );
        }

        // show deny message
        if (Object.keys(usedByNodes).length > 0) {
          const nr = store.state.tree.nodeRecord;
          let detailText = "";
          for (const id in usedByNodes) {
            detailText += `<div>- remove ${idToLink(
              id,
              nr
            )} from 'based on' of ${usedByNodes[id]
              .map(id => idToLink(id, nr))
              .join(", ")}</div>`;
          }
          toast.add({
            severity: "info",
            summary:
              "Cannot remove node until some other nodes use it or its children in their 'based on'",
            detail:
              "If you are sure you want to remove it, please: " + detailText,
            life: 30000
          });

          return;
        }
        addDialogVisible.value = !addDialogVisible.value;
      },
      remove: () => {
        addDialogVisible.value = false;
        toast.add({
          severity: "info",
          summary: "Please, wait",
          detail: "Removal can take up to 15 seconds",
          life: 15000
        });
        store.dispatch(`${actions.removeNode}`, selectedNode.value.id);
        store.commit(
          `positionChangePermits/${positionChangePermitMutations.ADD_NODES}`,
          store.state.tree.nodeRecord[
            selectedNode.value.id
          ].parent!.children.map(node => node.id)
        );
        // switch selectedNodeId to parent of removed node
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          store.state.tree.nodeRecord[selectedNode.value.id].parent!.id
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
