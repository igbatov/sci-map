<template>
  <ConfirmDialog></ConfirmDialog>
  <Toast position="bottom-left" />
  <NodeContent :show="!editModeOn && !!selectedNodeId" />
  <Menu
    :clickedTitleId="clickedTitleId"
    @select-precondition-is-on="setSelectPreconditionON"
    @select-precondition-is-off="setSelectPreconditionOFF"
  />
  <Map
    :layers="zoomedPanedLayers"
    :viewBox="viewBox"
    :selectedNodeId="selectedNodeId"
    :preconditionNodeIds="preconditionNodeIds"
    :pin-nodes="pinNodes"
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
import { useRouter, useRoute } from "vue-router";
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
import { findMapNodes } from "@/store/tree/helpers";
import { DBNode } from "@/api/types";

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
    const clickedTitleId = ref("-1");
    let selectPreconditionIsOn = false;
    let titleOver = false;

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
    const layers = ref<Array<Record<string, MapNode>>>([]);
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

        const oldVisibleNodeIDs = [];
        for (const layer of layers.value) {
          oldVisibleNodeIDs.push(
            ...Object.values(layer)
              .filter((n: MapNode) => !!n.title)
              .map((n: MapNode) => n.id)
          );
        }

        centralNodeId.value = newCentralNodeId;
        layers.value = updateLayers(
          newCentralNodeId,
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

    const zoomedPanedLayers = ref<Array<Record<string, MapNode>>>([]);
    watch(
      () => [zoomPanState.pan.x, zoomPanState.pan.y, zoomPanState.zoom, layers],
      () => {
        // layers это всегда слои с zoom=1 и pan={0, 0} состоящий из только видимых прямо сейчас элементов.
        // Мы применяем к этому объекту текущий zoomPanState но сам эталон не трогаем, поэтому здесь clone
        // Это не дорогая операция так как layers всегда содержит небольшое кол-во элементов
        // видимых только прямо сейчас
        const layersToZoomAndPan = clone(layers.value);
        zoomedPanedLayers.value = zoomAnPanLayers(
          layersToZoomAndPan,
          zoomPanState.zoom,
          zoomPanState.pan
        );
      },
      { immediate: true, deep: true }
    );

    return {
      pinNodes: computed(() => {
        if (centralNodeId.value == null) {
          return [];
        }
        const pinNodeIDs = pinState.pinsReverse[centralNodeId.value];
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
      viewBox,
      editModeOn: computed(() => store.state.editModeOn),
      selectedNodeId: computed(() => treeState.selectedNodeId),
      preconditionNodeIds: computed(() =>
        treeState.selectedNodeId
          ? store.state.precondition.preconditions[treeState.selectedNodeId]
          : []
      ),
      zoomedPanedLayers,
      nodeDragging: (e: EventDraggingNode) => {
        store.dispatch(`${actions.updateNodePosition}`, {
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
