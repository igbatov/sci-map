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
    color="#ffa500"
  />
  <SVGTextBox
    v-for="node of pinNodes"
    :text="node.title"
    :id="`${TITLE_PREFIX}${node.id}`"
    :key="node.id"
    :x="titleXY[node.id].x"
    :y="titleXY[node.id].y"
    line-height="8"
    :max-char-per-line="10"
    font-family="Roboto"
    :font-size="8"
    :font-weight="
      selectedNodeId && selectedNodeId === node.id ? 'bold' : 'normal'
    "
    color="#ffa500"
  />
  <rect
    v-for="node of pinNodes"
    :key="node.id"
    :x="titleXY[node.id].x"
    :y="titleXY[node.id].y"
    :width="titleBox[node.id] ? titleBox[node.id].bbox.width : 0"
    :height="titleBox[node.id] ? titleBox[node.id].bbox.height : 0"
    cursor="pointer"
    fill="transparent"
    @click="titleBoxClick(node.id)"
    @mousedown="nodeMouseDown(node.id)"
    stroke-width="0"
    stroke="pink"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, toRef } from "vue";
import { MapNode, Point } from "@/types/graphics";
import { getTitleBoxes } from "@/components/map_layer/MapLayer";
import PinMarker from "@/components/pin_layer/PinMarker.vue";
import {
  WIDTH as PIN_MARKER_WIDTH,
  HEIGHT as PIN_MARKER_HEIGHT
} from "@/components/pin_layer/PinMarker.vue";
import SVGTextBox from "@/components/SVGTextBox.vue";

const TITLE_PREFIX = "pin_title_";

export default defineComponent({
  name: "PinLayer",
  components: { SVGTextBox, PinMarker },
  emits: ["click", "title-mouse-down"],
  props: {
    pinNodes: {
      type: Object as PropType<Array<MapNode>>,
      required: true
    },
    selectedNodeId: {
      type: String,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    }
  },
  setup(props, ctx) {
    const pinNodes = toRef(props, "pinNodes");

    const titleBox = getTitleBoxes(TITLE_PREFIX, "left", pinNodes);

    return {
      TITLE_PREFIX,
      PIN_MARKER_HEIGHT,
      PIN_MARKER_WIDTH,
      titleBox,
      titleXY: computed(() => {
        const alignedXY: Record<string, Point> = {};
        for (const node of pinNodes.value) {
          alignedXY[node.id] = {
            x: titleBox.value[node.id]
              ? titleBox.value[node.id].position.x - PIN_MARKER_WIDTH / 2 - 1
              : 0,
            y: titleBox.value[node.id]
              ? titleBox.value[node.id].position.y - PIN_MARKER_HEIGHT / 2
              : 0
          };
        }
        return alignedXY;
      }),
      titleBoxClick: (nodeId: number) => {
        ctx.emit("click", { id: nodeId });
      },
      nodeMouseDown: (nodeId: number) => {
        ctx.emit("title-mouse-down", { id: nodeId });
      }
    };
  }
});
</script>
