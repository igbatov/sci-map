<template>
  <line
    v-if="from && to"
    :x1="from.x"
    :y1="from.y"
    :x2="to.x"
    :y2="to.y"
    :stroke="color"
    stroke-width="1"
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
    color: String,
    from: Object as PropType<Point>,
    to: (Object as PropType<Point>) || null
  }
});
</script>
