<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="`0 0 ${width} ${height}`">
    <polygon
      v-for="(path, i) of paths"
      :key="i"
      stroke="green"
      fill="transparent"
      stroke-width="1"
      :points="path"
    />
    <circle
      v-for="({ x, y }, i) of points"
      :key="i"
      :cx="x"
      :cy="y"
      r="1"
      stroke="red"
      fill="red"
      stroke-width="1"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Point from "@/types";

export default defineComponent({
  name: "DotsAndBorders",
  props: {
    polygons: {
      type: Object as PropType<Array<Array<Point>>>,
      required: true
    },
    points: Object as PropType<Array<Point>>,

    width: Number,
    height: Number
  },

  computed: {
    paths(): Array<string> {
      return this.polygons.map((points: Array<Point>) => {
        return points.map((point: Point) => `${point.x} ${point.y}`).join(",");
      });
    }
  }
});
</script>

<style scoped></style>
