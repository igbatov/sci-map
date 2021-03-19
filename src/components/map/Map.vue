<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <MapLayer
      v-for="(layer, index) of layers"
      :key="index"
      :map-nodes="layer"
      :border-color="
        `rgb(${200 - 100 * index},${200 - 100 * index},${200 - 100 * index})`
      "
      :font-size="10 * (index + 1)"
      :selectedNodeId="selectedNodeId"
      @dragging="draggingNode"
      @click="clickNode"
      @background-mouse-down="backgroundMouseDown(index)"
      @node-mouse-down="nodeMouseDown(index)"
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

export default defineComponent({
  name: "Map",
  emits: ["dragging-node", "click-node", "dragging-background", "wheel"],
  components: {
    MapLayer
  },
  props: {
    viewBox: {
      type: String,
      required: true
    },
    layers: Object as PropType<Array<Record<number, MapNode>>>,
    selectedNodeId: {
      type: Number,
      validator: (prop: number | null) =>
        typeof prop === "number" || prop === null,
      required: true
    }
  },
  setup(props, ctx) {
    watch(
      () => props.layers,
      () => pan.setLayers(props.layers),
      { immediate: true }
    );

    onMounted(() => {
      window.addEventListener("mousedown", async event => {
        await pan.mouseDown(event);
      });
      window.addEventListener("mouseup", () => {
        pan.mouseUp();
      });
      window.addEventListener("mousemove", event => {
        pan.mouseMove(ctx.emit, event);
      });
      window.addEventListener("wheel", event => {
        ctx.emit("wheel", {
          delta: event.deltaY,
          center: { x: event.clientX, y: event.clientY }
        });
      });
    });

    return {
      nodeMouseDown: (layerId: number) => {
        pan.bgMouseDownReject(layerId);
      },
      backgroundMouseDown: (layerId: number) => {
        pan.bgMouseDownResolve(layerId);
      },
      draggingNode: (e: EventDraggingNode) => {
        ctx.emit("dragging-node", {
          id: e.nodeId,
          delta: e.delta
        });
      },
      clickNode: (e: EventClickNode) => {
        ctx.emit("click-node", { id: e.id });
      }
    };
  }
});
</script>

<style scoped></style>
