<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="svgWidth"
    :height="svgHeight"
    :id="mapID"
    style="touch-action: none;"
  >
    <MapLayer
      v-for="(layer, index) of layers"
      :key="index"
      :layer-id="index"
      :map-nodes="layer"
      :border-color="borderColor(index)"
      :font-color="fontColor(index)"
      :font-size="fontSize(index)"
      :font-opacity="fontOpacity(index)"
      :selectedNodeId="selectedNodeId"
      :selectedNodePreconditionIds="selectedNodePreconditionIds"
      :searchResultNodeIDs="searchResultNodeIDs"
      :map-id="mapID"
      @title-dragging="draggingNode"
      @title-click="titleClick"
      @title-over="titleOver"
      @title-leave="titleLeave"
    />
    <PreconditionLayer
      :selectedNodeId="selectedNodeId"
      :visibleTitleIds="visibleTitleIds"
      :layer-id="`precondition`"
      @title-click="titleClick"
      @title-over="titleOver"
      @title-leave="titleLeave"
    />
    <PinLayer
      :pinNodes="pinNodes"
      :layer-id="`pinNodes`"
      color="pink"
      :font-size="8"
      font-weight="normal"
      text-decoration="none"
      :selectedNodeId="selectedNodeId"
      @title-click="titleClick"
      @title-over="titleOver"
      @title-leave="titleLeave"
    />
    <PinLayer
      :pinNodes="searchResultPinNodes"
      :layer-id="`searchResultPinNodes`"
      color="red"
      :font-size="10"
      font-weight="bold"
      text-decoration="underline"
      :selectedNodeId="selectedNodeId"
      @title-click="titleClick"
      @title-over="titleOver"
      @title-leave="titleLeave"
    />
  </svg>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType } from "vue";
import { MapNode } from "@/types/graphics";
import MapLayer from "@/components/map_layer/MapLayer.vue";
import {
  EventClickNode,
  EventDraggingNode
} from "@/components/map_layer/MapLayer";
import pan from "./MapPan";
import PinLayer from "@/components/pin_layer/PinLayer.vue";
import { printError } from "@/tools/utils";
import PreconditionLayer from "@/components/precondition_layer/PreconditionLayer.vue";

const mapID = "mapID";

export default defineComponent({
  name: "Map",
  emits: [
    "title-dragging",
    "title-click",
    "title-over",
    "title-leave",
    "dragging-background",
    "wheel"
  ],
  components: {
    PreconditionLayer,
    PinLayer,
    MapLayer
  },
  props: {
    layers: Object as PropType<Array<Record<string, MapNode>>>,
    selectedNodeId: {
      type: String || null,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    },
    selectedNodePreconditionIds: Object as PropType<string[]>,
    pinNodes: Object as PropType<MapNode[]>,
    searchResultPinNodes: Object as PropType<MapNode[]>,
    searchResultNodeIDs: Object as PropType<string[]>
  },
  setup(props, ctx) {
    onMounted(() => {
      const map = document.getElementById(mapID);
      if (!map) {
        printError("Map.vue: cannot find map id for event listener", {});
        return;
      }

      map.addEventListener("mousedown", event => {
        pan.mouseDown();
      });
      map.addEventListener("mouseup", event => {
        pan.mouseUp();
      });
      map.addEventListener("mousemove", event => {
        pan.mouseMove(ctx.emit, {
          from: {
            x: event.clientX - event.movementX,
            y: event.clientY - event.movementY
          },
          to: { x: event.clientX, y: event.clientY }
        });
      });

      // zoom with mouse wheel
      map.addEventListener(
        "wheel",
        event => {
          ctx.emit("wheel", {
            delta: event.deltaY,
            center: { x: event.clientX, y: event.clientY }
          });
        },
        { passive: true }
      );

      let prevDist = Infinity;
      const prevPoint = { x: Infinity, y: Infinity };
      map.addEventListener(
        "touchstart",
        event => {
          pan.mouseDown();
        },
        { passive: true }
      );
      map.addEventListener("touchend", event => {
        prevDist = Infinity;
        prevPoint.x = Infinity;
        prevPoint.y = Infinity;
        pan.mouseUp();
      });

      // mobile zoom
      map.addEventListener(
        "touchmove",
        e => {
          if (e.touches.length === 1) {
            if (prevPoint.x != Infinity && prevPoint.y != Infinity) {
              pan.mouseMove(ctx.emit, {
                from: prevPoint,
                to: { x: e.touches[0].clientX, y: e.touches[0].clientY }
              });
            }
            prevPoint.x = e.touches[0].clientX;
            prevPoint.y = e.touches[0].clientY;
          } else if (e.touches.length === 2) {
            let delta = 0;
            const dist = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            if (prevDist !== Infinity) {
              delta = prevDist - dist;
            }
            prevDist = dist;

            ctx.emit("wheel", {
              delta: delta,
              center: {
                x: (e.touches[0].pageX - e.touches[1].pageX) / 2,
                y: (e.touches[0].pageY - e.touches[1].pageY) / 2
              }
            });
          }
        },
        { passive: true }
      );
    });

    return {
      svgWidth: window.innerWidth,
      // 0.99 because if svg == innerHeight then browser vertical scroll bar appears
      svgHeight: 0.99 * window.innerHeight,
      visibleTitleIds: computed(() => {
        if (!props.layers) {
          return [];
        }
        const ids = [];
        for (const layer of props.layers) {
          for (const idx in layer) {
            if (layer[idx].title != "") {
              ids.push(idx);
            }
          }
        }
        return ids;
      }),
      draggingNode: (e: EventDraggingNode) => {
        ctx.emit("title-dragging", {
          id: e.nodeId,
          delta: e.delta
        });
      },
      titleClick: (e: EventClickNode) => {
        ctx.emit("title-click", { id: e.id });
      },
      titleOver: (e: EventClickNode) => {
        ctx.emit("title-over", { id: e.id });
      },
      titleLeave: (e: EventClickNode) => {
        ctx.emit("title-leave", { id: e.id });
      },
      mapID: mapID,
      fontSize: (index: number): number => {
        let size = 0;
        const levelSizes: Record<number, number> = {
          0: 0.4,
          1: 0.73,
          2: 1.4,
          3: 1.86
        };
        if (props.layers!.length >= 4) {
          size = levelSizes[index];
        }
        if (props.layers!.length == 3) {
          size = levelSizes[index + 1];
        }
        return size;
      },
      fontOpacity: (index: number): number => {
        let val = 0;
        const levelSizes: Record<number, number> = {
          0: 1,
          1: 1,
          2: 0.2,
          3: 1
        };
        if (props.layers!.length >= 4) {
          val = levelSizes[index];
        }
        if (props.layers!.length == 3) {
          val = levelSizes[index + 1];
        }
        return val;
      },
      fontColor: (index: number): string => {
        if (props.layers!.length >= 4) {
          return `rgb(${200 - 100 * index},${200 - 100 * index},${200 -
            100 * index})`;
        }
        if (props.layers!.length == 3) {
          return `rgb(${200 - 100 * (index + 1)},${200 -
            100 * (index + 1)},${200 - 100 * (index + 1)})`;
        }
        return "";
      },
      borderColor: (index: number): string => {
        let color = 0;
        const levelColors: Record<number, number> = {
          0: 240,
          1: 200,
          2: 100,
          3: 90
        };
        if (props.layers!.length >= 4) {
          color = levelColors[index];
        }
        if (props.layers!.length == 3) {
          color = levelColors[index + 1];
        }
        return `rgb(${color},${color},${color})`;
      }
    };
  }
});
</script>

<style scoped></style>
