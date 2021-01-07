<template>
  <polygon
    v-for="(mapNode, i) of mapNodes"
    :key="i"
    :stroke="borderColor"
    fill="transparent"
    stroke-width="1"
    :points="polygonToPath(mapNode.border)"
  />
  <text
    v-for="(mapNode, i) of mapNodes"
    :key="i"
    :x="mapNode.center.x"
    :y="mapNode.center.y"
    :font-family="font"
    :font-size="fontSize"
  >
    {{ mapNode.title }}
  </text>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { MapNode } from "@/types/graphics";
import { polygonToPath } from "@/tools/graphics";

export default defineComponent({
  name: "MapLayer",
  props: {
    mapNodes: {
      type: Object as PropType<Array<MapNode>>,
      required: true
    },
    borderColor: {
      type: String,
      required: true
    },
    font: {
      type: String,
      required: true
    },
    fontSize: {
      type: Number,
      required: true
    }
  },

  methods: {
    polygonToPath: polygonToPath
  }
});
</script>

<style scoped></style>
