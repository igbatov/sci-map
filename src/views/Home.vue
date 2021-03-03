<template>
  <Menu />
  <Map
    :layers="layers"
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
import {EventClickNode, EventDraggingBackground, EventDraggingNode, EventWheel} from "@/components/map/Map.ts";
import Menu from "@/components/menu/Index.vue";
import { useStore } from "@/store";
import { useRouter, useRoute } from "vue-router";
import { mutations as treeMutations } from "@/store/tree";
import { mutations as zoomPanMutations } from "@/store/zoom_pan";
import {filterNodesAndLayers, findCurrentNode} from "@/views/Home";
import { printError } from "@/tools/utils";
import NewErrorKV from "@/tools/errorkv";

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
          console.log("store.state.zoomPan.debouncedZoom", store.state.zoomPan.debouncedZoom)
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
        { width: window.innerWidth, height: window.innerHeight });
    if (err != null) {
      return [
        [],
        NewErrorKV("filterNodesAndLayers: error in findCurrentNode", { err })
      ];
    }

    return {
      layers: computed(() => {
        const [layers, err] = filterNodesAndLayers(
          treeState.mapNodeLayers,
          treeState.nodeRecord,
          currentNodeId
        );
        if (err) {
          printError("Home.vue: error in filterNodesAndLayers:", { err });
          return {};
        }
        return layers.reverse();
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
      mapDragging: (e: EventDraggingBackground) => {
        store.commit(
            `zoomPan/${zoomPanMutations.ADD_PAN}`,
            e
        );
      },
      zoom: (e: EventWheel) => {
        store.commit(
            `zoomPan/${zoomPanMutations.ADD_ZOOM}`,
            e.delta
        );
      }
    };
  }
});
</script>
