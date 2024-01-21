<template>
  <button @click="cut">cut</button>
  <button v-if="cutNodeID != null" @click="paste">Paste</button>
</template>

<script>
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions } from "@/store";
import {mutations as positionChangePermitMutations} from "@/store/position_change_permits";

export default {
  name: "CutPaste",
  setup() {
    const store = useStore();
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);
    const cutNodeID = ref(null);

    return {
      cutNodeID,
      cut: () => {
        cutNodeID.value = selectedNode.value.id;
      },
      paste: () => {
        // permit to move children of both new and old parents
        const oldParentChildrenID = store.state.tree.nodeRecord[cutNodeID.value].parent.children.map((node)=>node.id)
        const newParentChildrenID = store.state.tree.nodeRecord[selectedNode.value.id].node.children.map((node)=>node.id)
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
