<template>
  <a href="#" @click="goto($event, nodeID)">{{ nodeTitle }}</a>
</template>

<script lang="ts">
import {useRouter} from "vue-router";
import {defineComponent} from "vue";
import {useStore} from "@/store";
import { findMapNode } from "@/store/tree/helpers";
import {mutations as zoomPanMutations} from "@/store/zoom_pan";

export default defineComponent({
  name: "Link",
  props: {
    nodeID: {
      type: String,
      required: true
    },
    nodeTitle: {
      type: String,
      required: true
    },
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const treeState = store.state.tree;

    return {
      goto: (event: Event, id: string) => {
        event.preventDefault();
        const [firstNode] = findMapNode(
            id,
            treeState.mapNodeLayers
        );
        if (firstNode != null) {
          router.push({ name: "node", params: { id } });
          store.commit(`zoomPan/${zoomPanMutations.RESET_ZOOM_AND_PAN}`)
          store.commit(`zoomPan/${zoomPanMutations.SET_PAN}`, {
            x: -firstNode.center.x + treeState.mapNodeLayers[0]["0"].center.x,
            y: -firstNode.center.y + treeState.mapNodeLayers[0]["0"].center.y
          });
        }
      },
    }
  }
})
</script>
