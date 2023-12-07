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
    v-for="node of visiblePinNodes"
    :key="node.id"
    :x="node.center.x"
    :y="node.center.y"
    :color="color"
  />
  <SVGTextBox
    v-for="node of visiblePinNodes"
    :text="node.title"
    :id="`${TITLE_PREFIX}${node.id}`"
    :key="node.id"
    :useLineBreak="true"
    :x="titleXY[node.id].x"
    :y="titleXY[node.id].y"
    :line-height="8"
    :max-char-per-line="10"
    font-family="Roboto"
    :font-size=fontSize
    :font-weight="fontWeight"
    :color="color"
    :text-decoration="textDecoration"
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
    @mouseover="titleOver(node.id)"
    @mouseleave="titleLeave(node.id)"
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
  emits: [
    "title-click",
    "title-over",
    "title-leave",
  ],
  props: {
    pinNodes: {
      type: Object as PropType<MapNode[]>,
      required: true
    },
    selectedNodeId: {
      type: String,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    },
    color: {
      type: String,
    },
    fontWeight: {
      type: String,
    },
    fontSize: {
      type: Number,
    },
    textDecoration: {
      type: String,
    },
  },
  setup(props, ctx) {
    const allPinNodes = computed(() => {
      const result:Record<string, MapNode> = {}
      for (const node of props.pinNodes) {
        result[node.id] = node
      }
      return result
    })
    const visiblePinNodes = computed(() => {
      const result:Record<string, MapNode> = {}
      for (const node of props.pinNodes) {
        if (node.id != props.selectedNodeId) {
          result[node.id] = node
        }
      }
      return result
    })

    const titleBox = getTitleBoxes(TITLE_PREFIX, "left", allPinNodes);

    return {
      TITLE_PREFIX,
      PIN_MARKER_HEIGHT,
      PIN_MARKER_WIDTH,
      visiblePinNodes,
      titleBox,
      titleXY: computed(() => {
        const alignedXY: Record<string, Point> = {};
        for (const i in allPinNodes.value) {
          const node = allPinNodes.value[i];
          alignedXY[node.id] = {
            x: titleBox.value[node.id]
              ? titleBox.value[node.id].position.x
              : 0,
            y: titleBox.value[node.id]
              ? titleBox.value[node.id].position.y
              : 0
          };
        }
        return alignedXY;
      }),
      titleBoxClick: (nodeId: string) => {
        ctx.emit("title-click", { id: nodeId });
      },
      titleOver: (nodeId: string) => {
        ctx.emit("title-over", { id: nodeId });
      },
      titleLeave: (nodeId: string) => {
        ctx.emit("title-leave", { id: nodeId });
      },
    };
  }
});
</script>
