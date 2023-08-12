<template>
  <defs>
    <marker
      id="preconditionArrowHead"
      markerWidth="6"
      markerHeight="7"
      refX="3"
      refY="3.5"
      orient="auto"
    >
      <polygon fill="#aae3b9" stroke="#aae3b9" points="0 0, 6 3.5, 0 7" />
    </marker>
  </defs>
  <PreconditionArrow
    v-for="(precondition, index) in allPreconditions"
    :key="index"
    markerId="preconditionArrow"
    :from="precondition.from"
    :to="precondition.to"
    color="#aae3b9"
  />
  <PreconditionArrow
      v-for="precondition of selectedNodePreconditions"
      :key="precondition.id"
      markerId="preconditionArrow"
      :from="precondition.center"
      :to="selectedNode.center"
      color="#000"
  />
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watchEffect
} from "vue";
import PreconditionArrow from "@/components/precondition_layer/PreconditionArrow.vue";
import { useStore } from "@/store";
import {MapNode, Vector} from "@/types/graphics";
import { findMapNode, findMapNodes } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";
import { zoomAndPanPoint, zoomAnPanLayers } from "@/views/Home";

export default defineComponent({
  name: "PreconditionLayer",
  components: { PreconditionArrow },
  props: {
    selectedNodeId: String,
  },
  setup(props, ctx) {
    const store = useStore();
    const zoomPanState = store.state.zoomPan;

    /**
     * compute selectedNode
     */
    const selectedNode = computed(() => {
      if (props.selectedNodeId && store.state.tree.mapNodeLayers) {
        const [mapNode] = findMapNode(
          props.selectedNodeId,
          store.state.tree.mapNodeLayers
        );
        const zoomedPannedSelectedNode = clone(mapNode);
        zoomedPannedSelectedNode.center = zoomAndPanPoint(
          zoomedPannedSelectedNode.center,
          zoomPanState.zoom,
          zoomPanState.pan
        );
        return zoomedPannedSelectedNode;
      } else {
        return null;
      }
    });

    /**
     * compute selectedNodePreconditions
     */
    const selectedNodePreconditions = ref<Array<MapNode>>([]);
    watchEffect(() => {
      selectedNodePreconditions.value = [];
      if (
        props.selectedNodeId &&
        store.state.precondition.preconditions[props.selectedNodeId] &&
        store.state.tree.mapNodeLayers
      ) {
        const nodes = clone(
          findMapNodes(
            store.state.precondition.preconditions[props.selectedNodeId],
            store.state.tree.mapNodeLayers
          )
        );
        for (const node of nodes) {
          node.center = zoomAndPanPoint(
            node.center,
            zoomPanState.zoom,
            zoomPanState.pan
          );
          selectedNodePreconditions.value.push(node);
        }
      }
    });

    /**
     * compute all nodes all precondition arrows
     */
    const allPreconditions = ref<Array<Vector>>([]);
    watchEffect(() => {
      allPreconditions.value = [];
      if (
          store.state.precondition.preconditions &&
          store.state.tree.mapNodeLayers
      ) {
        for (const layer of store.state.tree.mapNodeLayers) {
          for (const i in layer) {
            const to = zoomAndPanPoint(
                layer[i].center,
                zoomPanState.zoom,
                zoomPanState.pan
            );
            if (!store.state.precondition.preconditions[layer[i].id]) {
              continue
            }
            const nodes = findMapNodes(
                store.state.precondition.preconditions[layer[i].id],
                store.state.tree.mapNodeLayers
            )
            for (const node of nodes) {
              const from = zoomAndPanPoint(
                  node.center,
                  zoomPanState.zoom,
                  zoomPanState.pan
              );
              allPreconditions.value.push({
                from: from,
                to: to,
              })
            }
          }
        }
      }
    });

    return {
      selectedNode,
      selectedNodePreconditions: selectedNodePreconditions,
      allPreconditions: allPreconditions,
    };
  }
});
</script>
