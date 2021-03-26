<template>
<!--  <circle-->
<!--    v-for="node of pinNodes"-->
<!--    :key="node.id"-->
<!--    :cx="node.center.x"-->
<!--    :cy="node.center.y"-->
<!--    r="10"-->
<!--    stroke="black"-->
<!--    stroke-width="1"-->
<!--    fill="red"-->
<!--  />-->
  <PinMarker
      v-for="node of pinNodes"
      :key="node.id"
      :x="node.center.x"
      :y="node.center.y"
  />
  <SVGTextBox
      v-for="node of pinNodes"
      :text="node.title"
      :id="`${TITLE_PREFIX}${node.id}`"
      :key="node.id"
      :x="titleBox[node.id] ? titleBox[node.id].position.x : 0"
      :y="titleBox[node.id] ? titleBox[node.id].position.y - titleBox[node.id].bbox.height : 0"
      line-height="6"
      max-char-per-line=10
      font-family="Roboto"
      :font-size="8"
      :font-weight="selectedNodeId && selectedNodeId === node.id ? 'bold' : 'normal'"
      color="#ffa500"
      :width="titleBox[node.id] ? titleBox[node.id].bbox.width : 0"
      :height="titleBox[node.id] ? titleBox[node.id].bbox.height : 0"
  />
  <rect
      v-for="node of pinNodes"
      :key="node.id"
      :x="titleBox[node.id] ? titleBox[node.id].position.x : 0"
      :y="titleBox[node.id] ? titleBox[node.id].position.y - titleBox[node.id].bbox.height : 0"
      :width="titleBox[node.id] ? titleBox[node.id].bbox.width : 0"
      :height="titleBox[node.id] ? titleBox[node.id].bbox.height : 0"
      fill="transparent"
      cursor="pointer"
      @click="titleBoxClick(node.id)"
  />
</template>

<script lang="ts">

import {defineComponent, PropType, toRef} from "vue";
import {MapNode} from "@/types/graphics";
import {getTitleBoxes} from "@/components/map_layer/MapLayer";
import PinMarker from "@/components/pin_layer/PinMarker.vue";
import SVGTextBox from "@/components/SVGTextBox.vue";

const TITLE_PREFIX = 'pin_title_';

export default defineComponent({
  name: "PinLayer",
  components: {SVGTextBox, PinMarker},
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
  setup(props, ctx) {
    const mapNodes = toRef(props, "pinNodes");

    const titleBox = getTitleBoxes(TITLE_PREFIX, "left", mapNodes)

    return {
      TITLE_PREFIX,
      titleBox,
      titleBoxClick: (nodeId: number) => {
        ctx.emit("click", { id: nodeId });
      }
    }
  }
});
</script>
