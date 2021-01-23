<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <MapLayer
      v-for="(layer, i) of layers"
      :key="i"
      :map-nodes="layer"
      :border-color="`rgb(${200 - 100 * i},${200 - 100 * i},${200 - 100 * i})`"
      :font-size="10 * (i + 1)"
      @dragging="
        $emit('dragging', {
          level: layers.length - i,
          id: $event.nodeId,
          newCenter: $event.newCenter
        })
      "
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { MapNode } from "@/types/graphics";
import MapLayer from "@/components/MapLayer.vue";

export default defineComponent({
  name: "Map",
  emits: ["dragging"],
  components: {
    MapLayer
  },
  props: {
    viewBox: String,
    layers: Object as PropType<Array<Record<number, MapNode>>>
  }
});
</script>

<style scoped></style>
