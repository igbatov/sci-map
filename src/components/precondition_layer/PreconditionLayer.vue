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
    <marker
      id="preconditionArrowHeadForSelectedNode"
      markerWidth="6"
      markerHeight="7"
      refX="3"
      refY="3.5"
      orient="auto"
    >
      <polygon fill="#000" stroke="#000" points="0 0, 6 3.5, 0 7" />
    </marker>
  </defs>
  <PreconditionArrow
    v-for="(precondition, index) in selectedNodePreconditions"
    :key="index"
    markerId="preconditionArrowHeadForSelectedNode"
    :from="precondition.from"
    :to="precondition.to"
    color="#000"
  />
  <PreconditionArrow
    v-for="(precondition, index) in layerPreconditions"
    :key="index"
    markerId="preconditionArrowHead"
    :from="precondition.from"
    :to="precondition.to"
    color="#aae3b9"
  />

</template>

<script lang="ts">
import {
  computed,
  defineComponent, PropType,
  ref,
  watchEffect
} from "vue";
import PreconditionArrow from "@/components/precondition_layer/PreconditionArrow.vue";
import { useStore } from "@/store";
import {MapNode, Vector} from "@/types/graphics";
import { findMapNode, findMapNodes } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";
import { zoomAndPanPoint, zoomAnPanLayers } from "@/views/Home";
import {getAllChildren} from "@/store/helpers";

export default defineComponent({
  name: "PreconditionLayer",
  components: { PreconditionArrow },
  props: {
    selectedNodeId: String,
    layer: Object as PropType<Record<string, MapNode>>,
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
     * For every node N of the props.layer get all its children preconditions
     * that are external to N and show them
     */
    const selectedNodePreconditions = ref<Array<Vector>>([]);
    const layerPreconditions = ref<Array<Vector>>([]);
    watchEffect(() => {
      selectedNodePreconditions.value = [];
      layerPreconditions.value = [];
      if (
          store.state.precondition.preconditions &&
          props.layer
      ) {
        let children
        let childrenIds
        for (const nodeId in props.layer) {
          const [node] = findMapNode(
              nodeId,
              store.state.tree.mapNodeLayers
          )
          const to = zoomAndPanPoint(
              node!.center,
              zoomPanState.zoom,
              zoomPanState.pan
          );
          children = getAllChildren(store.state.tree.nodeRecord[nodeId].node)
          children.push(store.state.tree.nodeRecord[nodeId].node)
          childrenIds = children.map(n => n.id)
          for (const child of children) {
            const [node] = findMapNode(
                child.id,
                store.state.tree.mapNodeLayers
            )
            if (!node) {
              continue
            }
            if (!store.state.precondition.preconditions[child.id]) {
              continue
            }
            const externalPreconditions = []
            for (const id of store.state.precondition.preconditions[child.id]) {
              if (childrenIds.indexOf(id) == -1) {
                externalPreconditions.push(id)
              }
            }
            const nodes = findMapNodes(
                externalPreconditions,
                store.state.tree.mapNodeLayers
            )
            for (const node of nodes) {
              const from = zoomAndPanPoint(
                  node.center,
                  zoomPanState.zoom,
                  zoomPanState.pan
              );
              if (nodeId == selectedNode.value.id) {
                selectedNodePreconditions.value.push({
                  from: from,
                  to: to,
                });
              } else {
                layerPreconditions.value.push({
                  from: from,
                  to: to,
                })
              }
            }
          }
        }
      }
    });

    return {
      selectedNode,
      selectedNodePreconditions: selectedNodePreconditions,
      layerPreconditions: layerPreconditions,
    };
  }
});
</script>
