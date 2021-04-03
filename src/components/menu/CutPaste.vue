<template>
  <button @click="cut">cut</button>
  <button v-if="cutNodeID != null" @click="paste">Paste</button>
</template>

<script>
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { mutations as treeMutations } from "@/store/tree";

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
        store.commit(`tree/${treeMutations.CUT_PASTE_NODE}`, {
          parentID: selectedNode.value.id,
          nodeID: cutNodeID.value
        });
        cutNodeID.value = null;
      }
    };
  }
};
</script>
