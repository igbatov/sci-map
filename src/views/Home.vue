<template>
  <Menu />
  <Map
    :layers="zoomedPanedLayers"
    :viewBox="viewBox"
    :selectedNodeId="selectedNodeId"
    :pin-nodes="pinNodes"
    @dragging-node="nodeDragging"
    @click-node="nodeClick"
    @dragging-background="mapDragging"
    @wheel="zoom"
  />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import Map from "@/components/map/Map.vue";
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
import {
  filterNodesAndLayers,
  findCurrentNode, zoomAndPanPoint,
  zoomAnPanLayers
} from "@/views/Home";
import {clone, printError} from "@/tools/utils";
import { MapNode } from "@/types/graphics";
import {findMapNodes} from "@/store/tree/helpers";

export default defineComponent({
  name: "Home",

  components: {
    Map,
    Menu
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const treeState = store.state.tree;
    const zoomPanState = store.state.zoomPan;
    const pinState = store.state.pin;

    watch(
      () => route.params,
      () => {
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          Number(route.params.id)
        );
      },
      { immediate: true }
    );

    /**
     * compute svg viewBox
     */
    const viewBox = computed(() => {
      if (treeState.tree && treeState.tree.position) {
        return `0 0 ${2 * treeState.tree.position.x} ${2 *
          treeState.tree.position.y}`;
      } else {
        return `0 0 1000 600`;
      }
    });

    const updateLayers = (
      currNodeId: number,
      mapNodeLayers: Array<Record<number, MapNode>>,
      nodeRecord: Record<number, NodeRecordItem>,
    ) => {
      // Вычленяем слои и узлы которые мы хотим показывать у читывая что текущий узел это currentNodeId
      const [layers, err] = filterNodesAndLayers(
        mapNodeLayers,
        nodeRecord,
        currNodeId
      );
      if (err) {
        printError("Home.vue: error in filterNodesAndLayers:", { err });
        return [];
      }
      return layers.reverse();
    };

    const currentNodeId = ref<number | null>(null);
    const layers = ref<Array<Record<number, MapNode>>>([]);
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

        currentNodeId.value = currNodeId
        layers.value = updateLayers(
          currNodeId,
          treeState.mapNodeLayers,
          treeState.nodeRecord,
        );
      },
      { immediate: true, deep: true }
    );

    return {
      pinNodes: computed(() => {
        if (currentNodeId.value == null) {
          return []
        }
        const pinNodeIDs = pinState.pinsReverse[currentNodeId.value]
        const pinMapNodes = findMapNodes(pinNodeIDs, treeState.mapNodeLayers)
        const result = []
        for (const pinMapNode of pinMapNodes) {
          const cl = clone(pinMapNode)
          cl.center = zoomAndPanPoint(pinMapNode.center, zoomPanState.zoom, zoomPanState.pan)
          result.push(cl)
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
      selectedNodeId: computed(() => treeState.selectedNodeId),
      nodeDragging: (e: EventDraggingNode) => {
        store.commit(`tree/${treeMutations.UPDATE_NODE_POSITION}`, {
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
