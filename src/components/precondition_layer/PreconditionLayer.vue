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
      v-for="precondition of selectedNodeAndPreconditions"
      :key="precondition.id"
      markerId="preconditionArrow"
      :from="precondition.center"
      :to="selectedNode.center"
      color="#aae3b9"
  />
  <SVGTextBox
      v-for="node of visibleTitleNodes"
      :text="node.title"
      :id="`${TITLE_PREFIX}${node.id}`"
      :key="node.id"
      :useLineBreak="true"
      :x="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].position.x : 0"
      :y="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].position.y : 0"
      :line-height="8"
      :max-char-per-line="10"
      font-family="Roboto"
      :font-size="8"
      font-weight='normal'
      color="#ffa500"
  />
  <rect
      v-for="node of visibleTitleNodes"
      :key="node.id"
      :x="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].position.x : 0"
      :y="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].position.y : 0"
      :width="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].bbox.width : 0"
      :height="visibleTitleNodeBoxes[node.id] ? visibleTitleNodeBoxes[node.id].bbox.height : 0"
      cursor="pointer"
      fill="transparent"
      @click="titleBoxClick(node.id)"
      @mouseover="titleBoxOver(node.id)"
      @mouseleave="titleBoxLeave(node.id)"
      stroke-width="0"
      stroke="pink"
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
import { MapNode } from "@/types/graphics";
import { findMapNode, findMapNodes } from "@/store/tree/helpers";
import { clone } from "@/tools/utils";
import { zoomAndPanPoint } from "@/views/Home";
import SVGTextBox from "@/components/SVGTextBox.vue";
import { getTitleBoxes } from "@/components/map_layer/MapLayer";

const TITLE_PREFIX = "precondition_title_";

export default defineComponent({
  name: "PreconditionLayer",
  emits: [
    "title-over",
    "title-leave",
    "title-click",
  ],
  components: {SVGTextBox, PreconditionArrow},
  props: {
    selectedNodeId: String,
    visibleTitleIds: Object as PropType<Array<string>>
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
        if (!mapNode) {
          return null
        }
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
    const selectedNodeAndPreconditions = ref<Record<string, MapNode>>({});
    const visibleTitleNodes = ref<Record<string, MapNode>>({});
    const visibleTitleNodeBoxes = getTitleBoxes(TITLE_PREFIX, "left", visibleTitleNodes);
    watchEffect(() => {
      selectedNodeAndPreconditions.value = {};
      visibleTitleNodes.value = {}
      if (props.selectedNodeId &&
          selectedNode.value &&
          store.state.tree.mapNodeLayers
      ) {
        selectedNodeAndPreconditions.value[selectedNode.value.id] = selectedNode.value;
      }
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
          selectedNodeAndPreconditions.value[node.id] = node;
        }
      }
      for (const id in selectedNodeAndPreconditions.value) {
        if (props.visibleTitleIds?.indexOf(id) == -1) {
          visibleTitleNodes.value[id] = selectedNodeAndPreconditions.value[id]
        }
      }
    });

    return {
      TITLE_PREFIX,
      selectedNode,
      selectedNodeAndPreconditions,
      visibleTitleNodes,
      visibleTitleNodeBoxes,
      titleBoxClick: (nodeId: string) => {
        ctx.emit("title-click", { id: nodeId });
      },
      titleBoxOver: (nodeId: string) => {
        ctx.emit("title-over", { id: nodeId });
      },
      titleBoxLeave: (nodeId: string) => {
        ctx.emit("title-leave", { id: nodeId });
      }
    };
  }
});
</script>
