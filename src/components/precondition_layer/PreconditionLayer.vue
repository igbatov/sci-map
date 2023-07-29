<template>
  <defs>
    <marker id="preconditionArrowHead" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
  <PreconditionArrow
      v-for="precondition of preconditions"
      :key="precondition.id"
      markerId="preconditionArrow"
      :from="precondition.center"
      :to="selectedNode.center"
  />
</template>

<script lang="ts">
import {computed, defineComponent, PropType, ref, watch, watchEffect} from "vue";
import PreconditionArrow from "@/components/precondition_layer/PreconditionArrow.vue";
import {useStore} from "@/store";
import {MapNode} from "@/types/graphics";
import {findMapNode, findMapNodes} from "@/store/tree/helpers";
import {clone} from "@/tools/utils";
import {zoomAndPanPoint, zoomAnPanLayers} from "@/views/Home";

export default defineComponent({
  name: "PreconditionLayer",
  components: {PreconditionArrow},
  props: {
    selectedNodeId: String,
    preconditionNodeIds: Object as PropType<string[]>,
  },
  setup(props, ctx) {
    const store = useStore();
    const preconditions = ref<Array<MapNode>>([]);
    const zoomPanState = store.state.zoomPan;
    const selectedNode = computed(()=>{
      if (props.selectedNodeId && store.state.tree.mapNodeLayers) {
        const [mapNode] = findMapNode(props.selectedNodeId, store.state.tree.mapNodeLayers)
        const zoomedPannedSelectedNode = clone(mapNode)
        zoomedPannedSelectedNode.center = zoomAndPanPoint(zoomedPannedSelectedNode.center, zoomPanState.zoom, zoomPanState.pan)
        return zoomedPannedSelectedNode
      } else {
        return null
      }
    })
    watchEffect(() => {
      preconditions.value = [];
      if (
          props.selectedNodeId &&
          store.state.precondition.preconditions[props.selectedNodeId] &&
          store.state.tree.mapNodeLayers
      ) {
        const nodes = clone(findMapNodes(store.state.precondition.preconditions[props.selectedNodeId], store.state.tree.mapNodeLayers))
        for (const node of nodes) {
          node.center = zoomAndPanPoint(node.center, zoomPanState.zoom, zoomPanState.pan);
          preconditions.value.push(node);
        }
      }
    });
    return {
      selectedNode,
      preconditions,
    }
  }
})
</script>
