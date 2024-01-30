<template>
  <ConfirmDialog></ConfirmDialog>
  <Toast position="bottom-left" />
  <NodeContent
      :show="!editModeOn"
      :selectedNodeId="selectedNodeId"
  />
  <Menu
    :clickedTitleId="clickedTitleId"
    @select-precondition-is-on="setSelectPreconditionON"
    @select-precondition-is-off="setSelectPreconditionOFF"
  />
  <Map
    :layers="visibleZoomedPanedLayers"
    :selectedNodeId="selectedNodeId"
    :selectedNodePreconditionIds="selectedNodePreconditionIds"
    :pin-nodes="pinNodes"
    :searchResultPinNodes="searchResultPinNodes"
    :searchResultNodeIDs="searchResultNodeIDs"
    @title-dragging="nodeDragging"
    @title-click="titleClick"
    @title-over="titleOver"
    @title-leave="titleLeave"
    @dragging-background="mapDragging"
    @wheel="zoom"
  />
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import Map from "@/components/map/Map.vue";
import NodeContent from "@/components/node_content/Index.vue";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";
import {
  EventClickNode,
  EventDraggingBackground,
  EventDraggingNode,
  EventWheel
} from "@/components/map/Map.ts";
import Menu from "@/components/menu/Index.vue";
import { useStore } from "@/store";
import { useRouter, useRoute, onBeforeRouteUpdate } from "vue-router";
import { mutations as treeMutations, NodeRecordItem } from "@/store/tree";
import { mutations as zoomPanMutations } from "@/store/zoom_pan";
import { actions } from "@/store/";
import {
  filterNodesAndLayers,
  findCentralNode,
  zoomAndPanPoint,
  zoomAnPanLayers
} from "@/views/Home";
import { clone, printError } from "@/tools/utils";
import { MapNode } from "@/types/graphics";
import {findMapNode, findMapNodes} from "@/store/tree/helpers";
import {actions as positionChangePermitsActions} from "@/store/position_change_permits";

export default defineComponent({
  name: "Home",

  components: {
    Map,
    Menu,
    NodeContent,
    ConfirmDialog,
    Toast
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const treeState = store.state.tree;
    const zoomPanState = store.state.zoomPan;
    const pinState = store.state.pin;
    const searchResultState = store.state.searchResult;
    const clickedTitleId = ref("-1");
    let selectPreconditionIsOn = false;
    let titleOver = false;

    // Set node from URL as selected
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
     * From mapNodeLayers method updateLayers determines visibleLayers and nodes
     * that will be shown to user (which is always just a small part of all nodes of the map)
     * @param centralNodeId
     * @param mapNodeLayers
     * @param nodeRecord
     */
    const updateLayers = (
      centralNodeId: string,
      mapNodeLayers: Array<Record<string, MapNode>>,
      nodeRecord: Record<string, NodeRecordItem>
    ): Array<Record<number, MapNode>> => {
      // Вычленяем слои и узлы которые мы хотим показывать учитывая что текущий видимый узел это centralNodeId
      const [filteredLayers, err] = filterNodesAndLayers(
        mapNodeLayers,
        nodeRecord,
        centralNodeId
      );
      if (err) {
        printError("Home.vue: error in filterNodesAndLayers:", { err });
        return [];
      }
      return filteredLayers.reverse();
    };

    const centralNodeId = ref<string | null>(null);
    // visibleLayers consists only from user visible nodes and visibleLayers of all (which is treeState.mapNodeLayers)
    const visibleLayers = ref<Array<Record<string, MapNode>>>([]);

    // Ugly hack to determine first load of page
    let isFirstPageLoad = true;
    onBeforeRouteUpdate(async (to, from) => {
      isFirstPageLoad = false
    })
    // If this is isFirstPageLoad then pan map to node in URL
    watch(
    () => [
          treeState.mapNodeLayers,
        ],
    () => {
      if (isFirstPageLoad && route.params.id.length > 0 && treeState.mapNodeLayers.length>0) {
        const [firstNode] = findMapNode(route.params.id as string, treeState.mapNodeLayers)
        if (firstNode != null) {
          store.commit(
              `zoomPan/${zoomPanMutations.SET_PAN}`,
              {x: -firstNode.center.x + treeState.mapNodeLayers[0]["0"].center.x, y: -firstNode.center.y + treeState.mapNodeLayers[0]["0"].center.y},
          );
        }
      }
    })


    // Determine which nodes to show based on current pan and zoom
    watch(
  () => [
        treeState.mapNodeLayers,
        zoomPanState.debouncedZoom,
        zoomPanState.debouncedPan
      ],
      () => {
        const [newCentralNodeId, err] = findCentralNode(
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

        centralNodeId.value = newCentralNodeId;
        visibleLayers.value = updateLayers(
          newCentralNodeId,
          treeState.mapNodeLayers,
          treeState.nodeRecord
        );
      },
      { immediate: true, deep: true }
    );

    const visibleZoomedPanedLayers = ref<Array<Record<string, MapNode>>>([]);
    watch(
      () => [zoomPanState.pan.x, zoomPanState.pan.y, zoomPanState.zoom, visibleLayers],
      () => {
        // visibleLayers это всегда слои с zoom=1 и pan={0, 0} состоящий из только видимых прямо сейчас элементов.
        // Мы применяем к этому объекту текущий zoomPanState но сам эталон не трогаем, поэтому здесь clone
        // Это не дорогая операция так как visibleLayers всегда содержит небольшое кол-во элементов
        // видимых только прямо сейчас
        const layersToZoomAndPan = clone(visibleLayers.value);
        visibleZoomedPanedLayers.value = zoomAnPanLayers(
          layersToZoomAndPan,
          zoomPanState.zoom,
          zoomPanState.pan
        );
      },
      { immediate: true, deep: true }
    );

    return {
      /**
       * pinNodes
       */
      pinNodes: computed(() => {
        if (centralNodeId.value == null) {
          return [];
        }
        const pinNodeIDs = pinState.pinsReverse[centralNodeId.value];
        if (!pinNodeIDs) {
          return [];
        }

        // remove pins that already exists on visibleLayers
        for (const layer of visibleLayers.value) {
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

      /**
       * searchResultNodeIDs
       */
      searchResultNodeIDs: computed(()=>{
        return searchResultState.nodeIDs
      }),

      /**
       * searchResultPinNodes
       */
      searchResultPinNodes: computed(() => {
        if (centralNodeId.value == null) {
          return [];
        }
        const searchResultNodeIDs = clone(searchResultState.nodeIDs);
        if (!searchResultNodeIDs) {
          return [];
        }

        // remove pins that already exists on visibleLayers
        for (const layer of visibleLayers.value) {
          for (const nodeID in layer) {
            const node = layer[nodeID];
            if (node.title != "") {
              const ind = searchResultNodeIDs.indexOf(node.id);
              if (ind != -1) {
                searchResultNodeIDs.splice(ind, 1);
              }
            }
          }
        }

        const searchResultMapNodes = findMapNodes(searchResultNodeIDs, treeState.mapNodeLayers);
        const result = [];
        for (const searchResultMapNode of searchResultMapNodes) {
          const cl = clone(searchResultMapNode);
          cl.center = zoomAndPanPoint(
            searchResultMapNode.center,
            zoomPanState.zoom,
            zoomPanState.pan
          );
          result.push(cl);
        }

        return result;
      }),

      editModeOn: computed(() => store.state.editModeOn),
      selectedNodeId: computed(() => treeState.selectedNodeId),
      selectedNodePreconditionIds: computed(() =>
        treeState.selectedNodeId
          ? store.state.precondition.preconditions[treeState.selectedNodeId]
          : []
      ),
      visibleZoomedPanedLayers: visibleZoomedPanedLayers,
      nodeDragging: async (e: EventDraggingNode) => {
        const hasDragPermit = await store.dispatch(`positionChangePermits/${positionChangePermitsActions.CheckNodeID}`, e.id);
        if (!hasDragPermit) {
          return
        }
        await store.dispatch(`${actions.updateNodePosition}`, {
          nodeId: e.id,
          delta: {
            x: e.delta.x / zoomPanState.zoom,
            y: e.delta.y / zoomPanState.zoom
          }
        });
      },
      setSelectPreconditionON: () => {
        selectPreconditionIsOn = true;
      },
      setSelectPreconditionOFF: () => {
        selectPreconditionIsOn = false;
      },
      clickedTitleId,
      titleClick: (e: EventClickNode) => {
        if (!selectPreconditionIsOn) {
          router.push({ name: "node", params: { id: e.id } });
        } else {
          clickedTitleId.value = e.id;
        }
      },
      titleOver: (e: EventClickNode) => {
        titleOver = true
        store.commit(`tree/${treeMutations.SET_SELECTED_NODE_ID}`, e.id);
      },
      titleLeave: (e: EventClickNode) => {
        titleOver = false
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          route.params.id
        );
      },
      mapDragging: (event: EventDraggingBackground) => {
        if (store.state.editModeOn && titleOver) {
          // to prevent pan while node position editing ( = title dragging in edit mode)
          return
        }
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
