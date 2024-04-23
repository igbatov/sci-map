<template>
  <ConfirmDialog></ConfirmDialog>
  <Toast position="bottom-left">
    <template #icon="slotProps">
      <div class="p-toast-message-icon">
        <span :class="slotProps.class"></span>
      </div>
    </template>
    <template #message="slotProps">
      <div class="p-toast-message-text">
        <span class="p-toast-summary">{{slotProps.message.summary}}</span>
        <div class="p-toast-detail" v-html="slotProps.message.detail" />
      </div>
    </template>
  </Toast>
  <div v-if="!(visibleZoomedPanedLayers && visibleZoomedPanedLayers.length)">
    <LogoDummy
        :wrapHeight="innerHeight"
        :wrapWidth="innerWidth"
    />
  </div>
  <div v-else>
    <div :class="isWideScreen() ? $style.textWrapperSearch : $style.textWrapperSearchMobile">
      <TextSearch :style="isWideScreen() ? '' : 'width: 80%;'" />
    </div>
    <Menu
        @restore-select-new-parent-is-on="setRestoreSelectNewParentON"
        @restore-select-new-parent-is-off="setRestoreSelectNewParentOFF"
        :clickedTitleId="clickedTitleId"
    />
    <div v-if="isWideScreen()">
      <NodeContent
          :clickedTitleId="clickedTitleId"
          @select-precondition-is-on="setSelectPreconditionON"
          @select-precondition-is-off="setSelectPreconditionOFF"
          :show="!editModeOn"
          :selectedNodeId="selectedNodeId"
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
    </div>
    <div v-else>
      <Splitter :style="`height:${innerHeight}px`" :gutterSize="15" layout="vertical" @resize="splitterResize($event)">
        <SplitterPanel class="flex align-items-center justify-content-center" :size="60">
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
        </SplitterPanel>
        <SplitterPanel class="flex align-items-center justify-content-center" :size="40">
          <NodeContent
              :wrapperHeight="contentSplitHeight"
              :clickedTitleId="clickedTitleId"
              @select-precondition-is-on="setSelectPreconditionON"
              @select-precondition-is-off="setSelectPreconditionOFF"
              :show="!editModeOn"
              :selectedNodeId="selectedNodeId"
          />
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
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
} from "@/components/map/Map";
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
  zoomAnPanLayers,
  zoomAnPanLayersInPlace
} from "@/views/Home";
import { clone, printError } from "@/tools/utils";
import { MapNode, Point } from "@/types/graphics";
import { findMapNode, findMapNodes } from "@/store/tree/helpers";
import { actions as positionChangePermitsActions } from "@/store/position_change_permits";
import api from "@/api/api";
import isMobile from 'ismobilejs';
import TextSearch from "@/components/menu/Textsearch.vue";
import {isWideScreen} from "@/components/helpers";
import Splitter, { SplitterResizeEvent } from 'primevue/splitter';
import SplitterPanel from 'primevue/splitterpanel';
import LogoDummy from "@/views/LogoDummy.vue";

export default defineComponent({
  name: "Home",

  components: {
    LogoDummy,
    Splitter,
    SplitterPanel,
    TextSearch,
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
    let restoreSelectNewParentIsOn = false;
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
     * Method updateLayers extracts visibleLayers and nodes from mapNodeLayers.
     * These are the nodes that will be visible to the user
     * (and are always just a small part of all nodes of the map).
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

    // Ugly hack to determine a first load of page
    let isFirstPageLoad = true;
    onBeforeRouteUpdate(async (to, from) => {
      isFirstPageLoad = false;
    });
    // If this is isFirstPageLoad then pan map to node in URL
    watch(
      () => [treeState.mapNodeLayers],
      () => {
        if (
          isFirstPageLoad &&
          route.params.id.length > 0 &&
          treeState.mapNodeLayers.length > 0
        ) {
          const [firstNode] = findMapNode(
            route.params.id as string,
            treeState.mapNodeLayers
          );
          if (firstNode != null) {
            store.commit(`zoomPan/${zoomPanMutations.SET_PAN}`, {
              x: -firstNode.center.x + treeState.mapNodeLayers[0]["0"].center.x,
              y: -firstNode.center.y + treeState.mapNodeLayers[0]["0"].center.y
            });
          }
        }
      }
    );

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
            {x:api.ROOT_CENTER_X, y:api.ROOT_CENTER_Y}
          // zoomPanState.zoomCenter
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
    let layersToZoomAndPan = [] as Array<Record<string, MapNode>>;
    watch(visibleLayers, ()=>{
      // visibleLayers это всегда слои с zoom=1 и pan={0, 0} состоящие только из видимых прямо сейчас элементов.
      // Мы применяем к этому объекту текущий zoomPanState, но сам эталон не трогаем, поэтому здесь clone
      const svg = document.getElementById("mapID") as any
      if (svg && isMobile().phone) {
        // сбрасываем svg трансформацию
        svg.setAttribute('transform', ` scale(1 1)`);
        const viewBox = svg.viewBox.baseVal;
        // сбрасываем pan viewBox
        viewBox.x = 0;
        viewBox.y = 0;
      }
      layersToZoomAndPan = clone(visibleLayers.value);
      visibleZoomedPanedLayers.value = zoomAnPanLayers(
          layersToZoomAndPan,
          zoomPanState.zoom,
          zoomPanState.pan
      );
    },{ immediate: true, deep: true })
    watch(
      () => [
        zoomPanState.zoom,
        zoomPanState.pan,
      ],
        (newArgs, oldArgs) => {
        if (!oldArgs) {
          visibleZoomedPanedLayers.value = zoomAnPanLayers(
              layersToZoomAndPan,
              zoomPanState.zoom,
              zoomPanState.pan
          )
        } else {
          const svg = document.getElementById("mapID") as any
          if (svg && isMobile().phone) {
            // для мобильного в реальном времени pan и zoom делаем через svg transform
            // т к на мобильном пересчет через zoomAnPanLayersInPlace притормаживает
            svg.setAttribute('transform-origin', ` ${zoomPanState.zoomCenter.x}px ${zoomPanState.zoomCenter.y}px`);
            svg.setAttribute('transform', ` scale(${zoomPanState.relative.zoom})`);
            // TODO: для pan вместо viewBox лучше использовать svg transform translate для единообразия
            // svg.setAttribute('transform', ` scale(${zoomPanState.relative.zoom}) translate(${zoomPanState.relative.pan.x} ${zoomPanState.relative.pan.y})`);
            // Но при таком подходе после pan обрезается все что вне экрана (так же как сейчас при zoom)
            // Если же использовать viewBox для zoom начинается какой-то неадекват с определением bbox для title:
            // viewBox.width =  viewBox.width/zoomPanState.relative.zoom
            // viewBox.height =  viewBox.height/zoomPanState.relative.zoom
            // Разбираться не стал, в результате пока что такой вот костыль из смеси viewBox и transform
            const viewBox = svg.viewBox.baseVal;
            viewBox.x = -zoomPanState.relative.pan.x;
            viewBox.y = -zoomPanState.relative.pan.y;
          } else {
            zoomAnPanLayersInPlace(
                visibleZoomedPanedLayers.value,
                newArgs[0] as number,
                newArgs[1] as Point,
                oldArgs[0] as number,
                oldArgs[1] as Point,
            );
          }
        }
      },
      { immediate: true, deep: true }
    );

    const contentSplitHeight = ref(window.innerHeight*0.4);

    return {
      innerHeight: window.innerHeight,
      innerWidth: window.innerWidth,
      isWideScreen,
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
          if (isMobile().phone) {
            cl.center = zoomAndPanPoint(
                pinMapNode.center,
                zoomPanState.debouncedZoom,
                zoomPanState.debouncedPan
            );
          } else {
            cl.center = zoomAndPanPoint(
                pinMapNode.center,
                zoomPanState.zoom,
                zoomPanState.pan
            );
          }

          result.push(cl);
        }

        return result;
      }),

      /**
       * searchResultNodeIDs
       */
      searchResultNodeIDs: computed(() => {
        return searchResultState.nodeIDs;
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

        const searchResultMapNodes = findMapNodes(
          searchResultNodeIDs,
          treeState.mapNodeLayers
        );
        const result = [];
        for (const searchResultMapNode of searchResultMapNodes) {
          const cl = clone(searchResultMapNode);
          if (isMobile().phone) {
            cl.center = zoomAndPanPoint(
                searchResultMapNode.center,
                zoomPanState.debouncedZoom,
                zoomPanState.debouncedPan
            );
          } else {
            cl.center = zoomAndPanPoint(
                searchResultMapNode.center,
                zoomPanState.zoom,
                zoomPanState.pan
            );
          }

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
        const hasDragPermit = await store.dispatch(
          `positionChangePermits/${positionChangePermitsActions.CheckNodeID}`,
          e.id
        );
        if (!hasDragPermit) {
          return;
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
        clickedTitleId.value = "-1"
      },
      setRestoreSelectNewParentON: () => {
        restoreSelectNewParentIsOn = true;
      },
      setRestoreSelectNewParentOFF: () => {
        restoreSelectNewParentIsOn = false;
      },
      clickedTitleId,
      titleClick: (e: EventClickNode) => {
        if (restoreSelectNewParentIsOn || selectPreconditionIsOn) {
          clickedTitleId.value = e.id;
        } else {
          router.push({ name: "node", params: { id: e.id } });
        }
      },
      titleOver: (e: EventClickNode) => {
        titleOver = true;
        store.commit(`tree/${treeMutations.SET_SELECTED_NODE_ID}`, e.id);
      },
      titleLeave: (e: EventClickNode) => {
        titleOver = false;
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          route.params.id
        );
      },
      mapDragging: (event: EventDraggingBackground) => {
        if (store.state.editModeOn && titleOver) {
          // to prevent pan while node position editing ( = title dragging in edit mode)
          return;
        }
        store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, event);
        store.commit(`zoomPan/${zoomPanMutations.ADD_RELATIVE_PAN}`, event);
      },
      zoom: (event: EventWheel) => {
        // initial value of a center (when root.border == viewport)
        const initial = {
          x: (event.center.x - zoomPanState.pan.x) / zoomPanState.zoom,
          y: (event.center.y - zoomPanState.pan.y) / zoomPanState.zoom
        };
        store.commit(
            `zoomPan/${zoomPanMutations.SET_ZOOM_CENTER}`,
            event.center
        );
        store.commit(`zoomPan/${zoomPanMutations.ADD_ZOOM}`, event.delta);
        const after = {
          x: initial.x * zoomPanState.zoom + zoomPanState.pan.x,
          y: initial.y * zoomPanState.zoom + zoomPanState.pan.y
        };
        store.commit(`zoomPan/${zoomPanMutations.ADD_PAN}`, {
          from: after,
          to: event.center
        });
      },
      splitterResize: (event: SplitterResizeEvent) => {
        contentSplitHeight.value = window.innerHeight*event.sizes[1]/100
      },
      contentSplitHeight,
    };
  }
});
</script>

<style module>
.textWrapperSearch {
  z-index:20;
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  width: 30%;
  padding: 15px 20px;
  background: linear-gradient(rgba(120, 120, 120, 0.4), rgba(120, 120, 120, 0));
}
.textWrapperSearchMobile {
  z-index:20;
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(rgba(120, 120, 120, 0.4), rgba(120, 120, 120, 0));
}
</style>
