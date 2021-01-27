<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <MapLayer
      v-for="(layer, i) of layers"
      :key="i"
      :map-nodes="layer"
      :border-color="`rgb(${200 - 100 * i},${200 - 100 * i},${200 - 100 * i})`"
      :font-size="10 * (i + 1)"
      :selectedNodeId="selectedNodeId"
      @dragging="
        $emit('dragging', {
          level: layers.length - i,
          id: $event.nodeId,
          newCenter: $event.newCenter
        })
      "
      @click="$emit('click', { id: $event.id })"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { MapNode } from "@/types/graphics";
import MapLayer from "@/components/MapLayer.vue";

export default defineComponent({
  name: "Map",
  emits: ["dragging", "click"],
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
  }
});
</script>

<style scoped></style>
