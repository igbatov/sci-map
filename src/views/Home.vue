<template>
  <Menu />
  <NodeContent :show="!editModeOn && !!selectedNodeId" />
  <Map
    :layers="zoomedPanedLayers"
    :viewBox="viewBox"
    :selectedNodeId="selectedNodeId"
    :pin-nodes="pinNodes"
    @dragging-node="nodeDragging"
    @click-node="nodeClick"
    @click-background="bgClick"
    @dragging-background="mapDragging"
    @wheel="zoom"
  />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import Map from "@/components/map/Map.vue";
import NodeContent from "@/components/node_content/Index.vue";
import {
  EventClickNode,
  EventDraggingBackground,
  EventDraggingNode,
  EventWheel
} from "@/components/map/Map.ts";
import Menu from "@/components/menu/Index.vue";
import { useStore } from "@/store";
import { useRouter, useRoute } from "vue-router";
import { mutations as treeMutations, NodeRecordItem } from "@/store/tree";
import { mutations as zoomPanMutations } from "@/store/zoom_pan";
import { actions } from "@/store/";
import {
  filterNodesAndLayers,
  findCurrentNode,
  zoomAndPanPoint,
  zoomAnPanLayers
} from "@/views/Home";
import { clone, printError } from "@/tools/utils";
import { MapNode } from "@/types/graphics";
import { findMapNodes } from "@/store/tree/helpers";
import { DBNode } from "@/api/types";

export default defineComponent({
  name: "Home",

  components: {
    Map,
    Menu,
    NodeContent
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const treeState = store.state.tree;
    const zoomPanState = store.state.zoomPan;
    const pinState = store.state.pin;

    watch(
      () => route.params.id,
      () => {
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          route.params.id
        );
      },
      { immediate: true }
    );

    /**
     * compute svg viewBox
     */
    const viewBox = computed(() => {
      if (treeState.mapNodeLayers && treeState.mapNodeLayers.length) {
        return `0 0 ${2 * treeState.mapNodeLayers[0]["0"].center.x} ${2 *
          treeState.mapNodeLayers[0]["0"].center.y}`;
      } else {
        return `0 0 1000 1000`;
      }
    });

    const updateLayers = (
      currNodeId: string,
      mapNodeLayers: Array<Record<string, MapNode>>,
      nodeRecord: Record<string, NodeRecordItem>
    ): Array<Record<number, MapNode>> => {
      // Вычленяем слои и узлы которые мы хотим показывать учитывая что текущий узел это currentNodeId
      const [filteredLayers, err] = filterNodesAndLayers(
        mapNodeLayers,
        nodeRecord,
        currNodeId
      );
      if (err) {
        printError("Home.vue: error in filterNodesAndLayers:", { err });
        return [];
      }
      return filteredLayers.reverse();
    };

    const currentNodeId = ref<string | null>(null);
    const layers = ref<Array<Record<string, MapNode>>>([]);
    watch(
      () => [treeState.mapNodeLayers, zoomPanState.debouncedZoom],
      () => {
        const [currNodeId, err] = findCurrentNode(
          treeState.mapNodeLayers,
          treeState.nodeRecord,
          { width: window.innerWidth, height: window.innerHeight },
          zoomPanState.debouncedZoom,
          zoomPanState.pan,
          zoomPanState.zoomCenter
        );
        if (err != null) {
          printError("filterNodesAndLayers: error in findCurrentNode", { err });
        }

        const oldVisibleNodeIDs = [];
        for (const layer of layers.value) {
          oldVisibleNodeIDs.push(
            ...Object.values(layer)
              .filter((n: MapNode) => !!n.title)
              .map((n: MapNode) => n.id)
          );
        }

        currentNodeId.value = currNodeId;
        layers.value = updateLayers(
          currNodeId,
          treeState.mapNodeLayers,
          treeState.nodeRecord
        );

        const newVisibleNodeIDs = [];
        for (const layer of layers.value) {
          newVisibleNodeIDs.push(
            ...Object.values(layer)
              .filter((n: MapNode) => !!n.title)
              .map((n: MapNode) => n.id)
          );
        }

        store.dispatch(actions.subscribeDBChange, {
          oldNodeIDs: oldVisibleNodeIDs,
          newNodeIDs: newVisibleNodeIDs,
          cb: (dbNode: DBNode) => store.dispatch(actions.handleDBUpdate, dbNode)
        });
      },
      { immediate: true, deep: true }
    );

    return {
      pinNodes: computed(() => {
        if (currentNodeId.value == null) {
          return [];
        }
        const pinNodeIDs = pinState.pinsReverse[currentNodeId.value];
        if (!pinNodeIDs) {
          return [];
        }

        // remove pins that already exists on layers
        for (const layer of layers.value) {
          for (const nodeID in layer) {
            const node = layer[nodeID];
            if (node.title != "") {
              const ind = pinNodeIDs.indexOf(node.id);
              if (ind != -1) {
                pinNodeIDs.splice(ind, 1);
              }
            }
          }
        }

        const pinMapNodes = findMapNodes(pinNodeIDs, treeState.mapNodeLayers);
        const result = [];
        for (const pinMapNode of pinMapNodes) {
          const cl = clone(pinMapNode);
          cl.center = zoomAndPanPoint(
            pinMapNode.center,
            zoomPanState.zoom,
            zoomPanState.pan
          );
          result.push(cl);
        }

        return result;
      }),
      zoomedPanedLayers: computed(() => {
        return zoomAnPanLayers(
          layers.value,
          zoomPanState.zoom,
          zoomPanState.pan
        );
      }),
      viewBox,
      editModeOn: computed(() => store.state.editModeOn),
      selectedNodeId: computed(() => treeState.selectedNodeId),
      nodeDragging: (e: EventDraggingNode) => {
        store.dispatch(`${actions.updateNodePosition}`, {
          nodeId: e.id,
          delta: {
            x: e.delta.x / zoomPanState.zoom,
            y: e.delta.y / zoomPanState.zoom
          }
        });
      },
      nodeClick: (e: EventClickNode) => {
        router.push({ name: "node", params: { id: e.id } });
      },
      bgClick: () => {
        router.push({ path: "/" });
      },
      mapDragging: (event: EventDraggingBackground) => {
        store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, event);
      },
      zoom: (event: EventWheel) => {
        // initial value of center (when root.border == viewport)
        const initial = {
          x: (event.center.x - zoomPanState.pan.x) / zoomPanState.zoom,
          y: (event.center.y - zoomPanState.pan.y) / zoomPanState.zoom
        };
        store.commit(`zoomPan/${zoomPanMutations.ADD_ZOOM}`, -1 * event.delta);
        const after = {
          x: initial.x * zoomPanState.zoom + zoomPanState.pan.x,
          y: initial.y * zoomPanState.zoom + zoomPanState.pan.y
        };
        store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, {
          from: after,
          to: event.center
        });
        store.commit(
          `zoomPan/${zoomPanMutations.SET_ZOOM_CENTER}`,
          event.center
        );
      }
    };
  }
});
</script>
