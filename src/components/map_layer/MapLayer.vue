<template>
  <polygon
    v-for="(mapNode, i) of mapNodes"
    :key="i"
    :stroke="borderColor"
    :fill="polygonFill(selectedNodeId, mapNode.id, selectedNodePreconditionIds)"
    :fill-opacity="
      polygonFillOpacity(
        selectedNodeId,
        mapNode.id,
        selectedNodePreconditionIds
      )
    "
    stroke-width="2"
    :points="polygonToPath(mapNode.border)"
    pointer-events="none"
  />
  <!--    <circle-->
  <!--      v-for="mapNode of mapNodes"-->
  <!--      :key="mapNode.id"-->
  <!--      :cx="mapNode.center.x"-->
  <!--      :cy="mapNode.center.y"-->
  <!--      r="10"-->
  <!--      stroke="black"-->
  <!--      stroke-width="1"-->
  <!--      fill="red"-->
  <!--    />-->
  <!--  <SVGTextBox> component shows unpredictable behaviour here and I didn't dig the reason so just used copy of SVGTextBox here -->
  <text
    v-for="mapNode of mapNodes"
    :id="`${TITLE_PREFIX}${mapNode.id}`"
    :key="mapNode.id"
    font-family="Roboto"
    :font-size="fontSize"
    :font-weight="textWeight(mapNode.id, selectedNodeId)"
    :fill="textColor(mapNode.id, selectedNodeId)"
    :fill-opacity="fontOpacity"
    :text-decoration="textDecoration(mapNode.id)"
    class="text"
  >
    <tspan
      v-for="(line, i) of splitLines(mapNode.title, 20)"
      :key="i"
      :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
      :y="
        titleBox[mapNode.id]
          ? titleBox[mapNode.id].position.y + i * fontSize
          : 0
      "
      alignment-baseline="hanging"
    >
      {{ line }}
    </tspan>
  </text>
  <!-- Add rectangle to change cursor to pointer when hover on text -->
  <rect
    v-for="mapNode of mapNodes"
    :key="mapNode.id"
    :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
    :y="titleBox[mapNode.id] ? titleBox[mapNode.id].position.y : 0"
    :width="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.width : 0"
    :height="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.height : 0"
    fill="transparent"
    stroke-width="0"
    @mouseover="titleOver(mapNode.id)"
    @mouseleave="titleLeave(mapNode.id)"
    @click="titleClick(mapNode.id)"
    @mousedown="titleMouseDown(mapNode.id)"
    stroke="pink"
    cursor="pointer"
    pointer-events="fill"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  toRef,
  onMounted,
  onUnmounted,
  computed
} from "vue";
import { MapNode } from "@/types/graphics";
import {
  polygonToPath,
  polygonFill,
  polygonFillOpacity
} from "@/tools/graphics";
import {
  setTitleBoxes,
  MouseDownInfo,
  mouseMoveListener,
  mouseUpListener
} from "@/components/map_layer/MapLayer";
import { printError } from "@/tools/utils";
import { splitLines } from "@/components/SVGTextBox";
import { useStore } from "@/store";
import { TitleBox, mutations as titleBoxMutations } from "@/store/title_box";

const TITLE_PREFIX = "title_";

export default defineComponent({
  name: "MapLayer",
  emits: [
    "title-over",
    "title-leave",
    "title-click",
    "title-drop",
    "title-dragging"
  ],
  props: {
    layerId: {
      type: Number
    },
    mapId: {
      type: String,
      required: true
    },
    mapNodes: {
      type: Object as PropType<Record<string, MapNode>>,
      required: true
    },
    borderColor: {
      type: String,
      required: true
    },
    fontSize: {
      type: Number,
      required: true
    },
    fontColor: {
      type: String,
      required: true
    },
    fontOpacity: {
      type: Number,
      required: true
    },
    selectedNodeId: {
      type: String,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    },
    selectedNodePreconditionIds: Object as PropType<string[]>,
    searchResultNodeIDs: Object as PropType<string[]>
  },

  setup(props, ctx) {
    const mapNodes = toRef(props, "mapNodes");

    const store = useStore();
    const layerID = "map_" + props.layerId;
    const titleBox = computed(() => {
      return store.state.titleBox.layerMap[layerID];
    });
    setTitleBoxes(
      TITLE_PREFIX,
      "center",
      mapNodes,
      (titleBoxMap: Record<string, TitleBox>) => {
        store.commit(`titleBox/${titleBoxMutations.SET_MAP}`, {
          layerName: layerID,
          titleBoxMap
        });
      }
    );

    /**
     * Send event on titleBox click, drag and drop
     */
    const titleMouseDownInfo: MouseDownInfo = {
      nodeId: null,
      dragStart: false
    };
    const mouseMove = (event: MouseEvent) =>
      mouseMoveListener(ctx.emit, event, titleMouseDownInfo);
    const mouseUp = () => mouseUpListener(ctx.emit, titleMouseDownInfo);
    onMounted(() => {
      const map = document.getElementById(props.mapId);
      if (!map) {
        printError("MapLayer.vue: cannot find map id for event listener", {});
        return;
      }
      map.addEventListener("mousemove", mouseMove);
      map.addEventListener("mouseup", mouseUp);
    });
    onUnmounted(() => {
      const map = document.getElementById(props.mapId);
      if (!map) {
        printError("MapLayer.vue: cannot find map id for event listener", {});
        return;
      }
      map.removeEventListener("mousemove", mouseMove);
      map.removeEventListener("mouseup", mouseUp);
    });

    const searchResultNodeIDsMap = computed(() => {
      const map = {} as Record<string, boolean>;
      if (!props.searchResultNodeIDs) {
        return map;
      }
      for (const id of props.searchResultNodeIDs) {
        map[id] = true;
      }
      return map;
    });

    return {
      TITLE_PREFIX,
      titleBox,
      textColor: (nodeID: string, selectedNodeId: string) => {
        if (selectedNodeId && selectedNodeId == nodeID) {
          return "#ffa500";
        }
        if (
          props.selectedNodePreconditionIds &&
          props.selectedNodePreconditionIds?.indexOf(nodeID) != -1
        ) {
          return "#ffa500";
        }
        if (searchResultNodeIDsMap.value[nodeID]) {
          return "red";
        }

        return props.fontColor;
      },
      textWeight: (nodeID: string, selectedNodeId: string) => {
        if (selectedNodeId && selectedNodeId == nodeID) {
          return "bold";
        }
        if (searchResultNodeIDsMap.value[nodeID]) {
          return "bold";
        }

        return "normal";
      },
      textDecoration: (nodeID: string) => {
        if (searchResultNodeIDsMap.value[nodeID]) {
          return "underline";
        }

        return "none";
      },
      titleClick: (nodeID: string) => {
        ctx.emit("title-click", {
          id: nodeID
        });
      },
      titleOver: (nodeID: string) => {
        ctx.emit("title-over", {
          id: nodeID
        });
      },
      titleLeave: (nodeID: string) => {
        ctx.emit("title-leave", {
          id: nodeID
        });
      },
      titleMouseDown: (id: string) => {
        titleMouseDownInfo.nodeId = id;
        titleMouseDownInfo.dragStart = false;
      }
    };
  },

  methods: {
    splitLines,
    polygonToPath,
    polygonFill,
    polygonFillOpacity
  }
});
</script>

<style scoped>
.text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
