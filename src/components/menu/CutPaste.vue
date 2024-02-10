<template>
  <MenuButton v-if="cutNodeID == null" @click="cut" :disabled="!selectedNode">
    <img alt="icon" src="../../assets/images/cut.svg" style="width: 20px" />
    <span class="p-ml-2">cut</span>
  </MenuButton>
  <MenuButton v-if="cutNodeID != null" @click="paste">
    <img alt="icon" src="../../assets/images/paste.svg" style="width: 20px" />
    <span class="p-ml-2">paste</span>
  </MenuButton>
</template>

<script>
import { useStore, actions } from "@/store";
import { computed, ref } from "vue";
import { mutations as positionChangePermitMutations } from "@/store/position_change_permits";
import MenuButton from "@/components/menu/MenuButton.vue";

export default {
  name: "CutPaste",
  components: { MenuButton },
  setup() {
    const store = useStore();
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);
    const cutNodeID = ref(null);

    return {
      selectedNode,
      cutNodeID,
      cut: () => {
        cutNodeID.value = selectedNode.value.id;
      },
      paste: () => {
        // permit to move children of both new and old parents
        const oldParentChildrenID = store.state.tree.nodeRecord[
          cutNodeID.value
        ].parent.children.map(node => node.id);
        const newParentChildrenID = store.state.tree.nodeRecord[
          selectedNode.value.id
        ].node.children.map(node => node.id);
        store.commit(
          `positionChangePermits/${positionChangePermitMutations.ADD_NODES}`,
          [...oldParentChildrenID, ...newParentChildrenID]
        );

        // do cut and paste of node
        store.dispatch(`${actions.cutPasteNode}`, {
          nodeID: cutNodeID.value,
          parentID: selectedNode.value.id
        });

        cutNodeID.value = null;
      }
    };
  }
};
</script>
