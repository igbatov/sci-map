<template>
  <line
    :x1="from.x"
    :y1="from.y"
    :x2="to.x"
    :y2="to.y"
    stroke="#000"
    stroke-width="2"
    marker-end="url(#preconditionArrowHead)"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Point } from "@/types/graphics";

export default defineComponent({
  name: "PreconditionArrow",
  props: {
    markerId: String,
    from: Object as PropType<Point>,
    to: Object as PropType<Point>
  }
});
</script>
