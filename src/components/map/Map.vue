<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" :id="mapID">
    <MapLayer
      v-for="(layer, index) of layers"
      :key="index"
      :map-nodes="layer"
      :border-color="
        `rgb(${200 - 100 * index},${200 - 100 * index},${200 - 100 * index})`
      "
      :font-size="10 * (index + 1)"
      :selectedNodeId="selectedNodeId"
      :preconditionNodeIds="preconditionNodeIds"
      :map-id="mapID"
      @title-dragging="draggingNode"
      @title-click="titleClick"
      @title-over="titleOver"
      @title-leave="titleLeave"
    />
    <PinLayer
      :pinNodes="pinNodes"
      :selectedNodeId="selectedNodeId"
      @click="titleClick"
      @title-mouse-down="pinNodeMouseDown"
    />
    <PreconditionLayer
      :preconditionNodeIds="preconditionNodeIds"
      :selectedNodeId="selectedNodeId"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, watch } from "vue";
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
    viewBox: {
      type: String,
      required: true
    },
    layers: Object as PropType<Array<Record<string, MapNode>>>,
    selectedNodeId: {
      type: String || null,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    },
    preconditionNodeIds: Object as PropType<string[]>,
    pinNodes: Object as PropType<MapNode[]>
  },
  setup(props, ctx) {
    onMounted(() => {
      const map = document.getElementById(mapID);
      if (!map) {
        printError("Map.vue: cannot find map id for event listener", {});
        return;
      }
      map.addEventListener("mousedown", async event => {
        await pan.mouseDown(event);
      });
      map.addEventListener("mouseup", async event => {
        await pan.mouseUp(event);
      });
      map.addEventListener("mousemove", event => {
        pan.mouseMove(ctx.emit, event);
      });
      map.addEventListener("wheel", event => {
        ctx.emit("wheel", {
          delta: event.deltaY,
          center: { x: event.clientX, y: event.clientY }
        });
      });
    });

    return {
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
      pinNodeMouseDown: () => {
        pan.pinNodeMouseDownHandler();
      },
      mapID: mapID
    };
  }
});
</script>

<style scoped></style>
