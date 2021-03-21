<template>
  <circle
    v-for="node of pinNodes"
    :key="node.id"
    :cx="node.center.x"
    :cy="node.center.y"
    r="10"
    stroke="black"
    stroke-width="1"
    fill="red"
  />
  <text
      v-for="node of pinNodes"
      :id="`pin_title_${node.id}`"
      :key="node.id"
      :x="node.center.x"
      :y="node.center.y"
      font-family="Roboto"
      :font-size="8"
      :font-weight="
      selectedNodeId && selectedNodeId === node.id ? 'bold' : 'normal'
    "
      fill="orange"
      class="text"
  >
    {{ node.title }}
  </text>
<!--  <rect-->
<!--      v-for="node of pinNodes"-->
<!--      :key="node.id"-->
<!--      :x="titleBox[node.id] ? titleBox[node.id].position.x : 0"-->
<!--      :y="-->
<!--        titleBox[node.id]-->
<!--          ? titleBox[node.id].position.y - titleBox[node.id].bbox.height-->
<!--          : 0-->
<!--      "-->
<!--      :width="titleBox[node.id] ? titleBox[node.id].bbox.width : 0"-->
<!--      :height="titleBox[node.id] ? titleBox[node.id].bbox.height : 0"-->
<!--      fill="transparent"-->
<!--      cursor="pointer"-->
<!--  />-->
</template>

<script lang="ts">

import {defineComponent, PropType} from "vue";
import {MapNode} from "@/types/graphics";

export default defineComponent({
  name: "PinLayer",
  emits: [
    "click"
  ],
  props: {
    pinNodes: {
      type: Object as PropType<Array<MapNode>>,
      required: true
    },
    selectedNodeId: {
      type: Number,
      validator: (prop: number | null) =>
          typeof prop === "number" || prop === null,
      required: true
    }
  },
});
</script>
