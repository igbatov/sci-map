<template>
  <Menu />
  <Map
    :layers="zoomPanLayers"
    :viewBox="viewBox"
    :selectedNodeId="selectedNodeId"
    @dragging-node="nodeDragging"
    @click-node="nodeClick"
    @dragging-background="mapDragging"
    @wheel="zoom"
  />
</template>

<script lang="ts">
import { computed, defineComponent, watch } from "vue";
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
import { mutations as treeMutations } from "@/store/tree";
import { mutations as zoomPanMutations } from "@/store/zoom_pan";
import {
  filterNodesAndLayers,
  findCurrentNode,
  zoomAnPanLayers
} from "@/views/Home";
import { printError } from "@/tools/utils";
import NewErrorKV from "@/tools/errorkv";
import { MapNode } from "@/types/graphics";

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

    watch(
      () => store.state.zoomPan.debouncedZoom,
      () => {
        console.log(
          "store.state.zoomPan.debouncedZoom",
          store.state.zoomPan.debouncedZoom
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

    /**
     * Вычисляем currentNodeId
     * Этот метод надо будет вызывать после каждого zoom и pan после того как будет сделана SM-25 и SM-24
     */
    const [currentNodeId, err] = findCurrentNode(
      treeState.mapNodeLayers,
      treeState.nodeRecord,
      { width: window.innerWidth, height: window.innerHeight }
    );
    if (err != null) {
      return [
        [],
        NewErrorKV("filterNodesAndLayers: error in findCurrentNode", { err })
      ];
    }

    const layers = computed<Record<number, MapNode>[]>(() => {
      const [layers, err] = filterNodesAndLayers(
        treeState.mapNodeLayers,
        treeState.nodeRecord,
        currentNodeId
      );
      if (err) {
        printError("Home.vue: error in filterNodesAndLayers:", { err });
        return [];
      }
      return layers.reverse();
    });

    return {
      zoomPanLayers: computed(() => {
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
          position: e.newCenter
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
        store.commit(`zoomPan/${zoomPanMutations.ADD_ZOOM}`, event.delta);
        const after = {
          x: initial.x * zoomPanState.zoom + zoomPanState.pan.x,
          y: initial.y * zoomPanState.zoom + zoomPanState.pan.y
        };
        store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, {
          from: after,
          to: event.center
        });
      }
    };
  }
});
</script>
