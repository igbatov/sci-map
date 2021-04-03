<template>
  <polygon
    v-for="(mapNode, i) of mapNodes"
    :key="i"
    :stroke="borderColor"
    fill="transparent"
    stroke-width="2"
    :points="polygonToPath(mapNode.border)"
    pointer-events="none"
  />
<!--    <circle-->
<!--      v-for="mapNode of mapNodes"-->
<!--      :key="mapNode.id"-->
<!--      :cx="mapNode.center.x"-->
<!--      :cy="mapNode.center.y"-->
<!--      r="10"-->
<!--      stroke="black"-->
<!--      stroke-width="1"-->
<!--      fill="red"-->
<!--    />-->
  <text
    v-for="mapNode of mapNodes"
    :id="`${TITLE_PREFIX}${mapNode.id}`"
    :key="mapNode.id"
    font-family="Roboto"
    :font-size="fontSize"
    :font-weight="
      selectedNodeId && selectedNodeId == mapNode.id ? 'bold' : 'normal'
    "
    :fill="borderColor"
    class="text"
  >
    <tspan
        :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
        :y="titleBox[mapNode.id] ? titleBox[mapNode.id].position.y : 0"
        alignment-baseline="hanging"
    >
      {{ mapNode.title }}
    </tspan>
  </text>
  <!-- Add rectangle to change cursor to pointer when hover on text -->
  <rect
    v-for="mapNode of mapNodes"
    :key="mapNode.id"
    :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
    :y=" titleBox[mapNode.id] ? titleBox[mapNode.id].position.y : 0"
    :width="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.width : 0"
    :height="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.height : 0"
    fill="transparent"
    stroke-width=0
    stroke="pink"
    cursor="pointer"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  toRef,
  onMounted,
  onUnmounted,
} from "vue";
import { MapNode } from "@/types/graphics";
import { polygonToPath } from "@/tools/graphics";
import {
  getTitleBoxes, MouseDownInfo,
  mouseDownListener,
  mouseMoveListener,
  mouseUpListener,
} from "@/components/map_layer/MapLayer";

const TITLE_PREFIX = 'title_';

export default defineComponent({
  name: "MapLayer",
  emits: [
    "click",
    "drop",
    "dragging",
    "node-mouse-down",
    "background-mouse-down"
  ],
  props: {
    mapNodes: {
      type: Object as PropType<Array<MapNode>>,
      required: true
    },
    borderColor: {
      type: String,
      required: true
    },
    fontSize: {
      type: Number,
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
    const mapNodes  = toRef(props, "mapNodes");

    const titleBox = getTitleBoxes(TITLE_PREFIX, "center", mapNodes)

    /**
     * Send event on titleBox click, drag and drop
     */
    const mouseDownInfo: MouseDownInfo = {nodeId: null, dragStart: false};
    const mouseDown = (event: MouseEvent) => mouseDownListener(ctx.emit, event, titleBox, mouseDownInfo)
    const mouseMove = (event: MouseEvent) => mouseMoveListener(ctx.emit, event, mouseDownInfo)
    const mouseUp = () => mouseUpListener(ctx.emit, mouseDownInfo)
    onMounted(() => {
      window.addEventListener("mousedown", mouseDown);
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    });
    onUnmounted(() => {
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    });

    return {
      TITLE_PREFIX,
      titleBox
    };
  },

  methods: {
    polygonToPath: polygonToPath
  }
});
</script>

<style scoped>
.text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
