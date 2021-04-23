<template>
  <button @click="cut">cut</button>
  <button v-if="cutNodeID != null" @click="paste">Paste</button>
</template>

<script>
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions } from "@/store";

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
