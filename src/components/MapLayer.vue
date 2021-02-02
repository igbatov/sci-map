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
  <!--  <circle-->
  <!--    v-for="mapNode of mapNodes"-->
  <!--    :key="mapNode.id"-->
  <!--    :cx="mapNode.center.x"-->
  <!--    :cy="mapNode.center.y"-->
  <!--    r="10"-->
  <!--    stroke="black"-->
  <!--    stroke-width="1"-->
  <!--    fill="red"-->
  <!--  />-->
  <text
    v-for="mapNode of mapNodes"
    :id="`title_${mapNode.id}`"
    :key="mapNode.id"
    :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
    :y="titleBox[mapNode.id] ? titleBox[mapNode.id].position.y : 0"
    font-family="Roboto"
    :font-size="fontSize"
    :font-weight="
      selectedNodeId && selectedNodeId === mapNode.id ? 'bold' : 'normal'
    "
    :fill="borderColor"
  >
    {{ mapNode.title }}
  </text>
  <!-- Add rectangle to change cursor to pointer when hover on text -->
  <rect
    v-for="mapNode of mapNodes"
    :key="mapNode.id"
    :x="titleBox[mapNode.id] ? titleBox[mapNode.id].position.x : 0"
    :y="
      titleBox[mapNode.id]
        ? titleBox[mapNode.id].position.y - titleBox[mapNode.id].bbox.height
        : 0
    "
    :width="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.width : 0"
    :height="titleBox[mapNode.id] ? titleBox[mapNode.id].bbox.height : 0"
    fill="transparent"
    cursor="pointer"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  toRefs,
  onMounted,
  nextTick,
  ref,
  watch
} from "vue";
import { MapNode, Point } from "@/types/graphics";
import { polygonToPath } from "@/tools/graphics";
import { nodeToTitleBox } from "@/components/MapLayer";

export default defineComponent({
  name: "MapLayer",
  emits: ["click", "drop", "dragging", "node-mouse-down"],
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
      type: Number,
      validator: (prop: number | null) =>
        typeof prop === "number" || prop === null,
      required: true
    }
  },

  setup(props, ctx) {
    const { mapNodes } = toRefs(props);

    /**
     * Update titleBox on every prop change after DOM rerender
     */
    const titleBox = ref(nodeToTitleBox(mapNodes));
    const titleXYUpdate = (mapNodes: Array<MapNode>) => {
      // Code that will run only after the entire view has been rendered
      nextTick(() => {
        for (const i in mapNodes) {
          const node = mapNodes[i];
          const dom = document.getElementById(`title_${node.id}`);
          if (dom == null) {
            continue;
          }
          titleBox.value[node.id] = {
            position: {
              x: node.center.x - dom.getBoundingClientRect().width / 2,
              y: node.center.y + dom.getBoundingClientRect().height / 4
            },
            bbox: {
              width: dom.getBoundingClientRect().width,
              height: 1.2 * dom.getBoundingClientRect().height // 1.2 to make title box a little bit taller
            }
          };
        }
      });
    };
    watch(
      () => props.mapNodes,
      mapNodes => titleXYUpdate(mapNodes),
      {
        immediate: true
      }
    );

    /**
     * Send event on titleBox click, drag and drop
     */
    let mouseDownInfo: {
      nodeId: number;
      pointer: Point;
      nodeCenter: Point;
    } | null = null;
    let dragStart = false;
    onMounted(() => {
      window.addEventListener("mousedown", event => {
        for (const id in titleBox.value) {
          const { x, y } = titleBox.value[id].position;
          const { width, height } = titleBox.value[id].bbox;
          if (
            event.clientX >= x &&
            event.clientX <= x + width &&
            event.clientY >= y - height &&
            event.clientY <= y
          ) {
            ctx.emit("node-mouse-down", { id: Number(id) });
            mouseDownInfo = {
              nodeId: Number(id),
              pointer: { x: event.clientX, y: event.clientY },
              nodeCenter: mapNodes.value[id].center
            };
            break;
          }
        }
      });
      window.addEventListener("mousemove", event => {
        if (mouseDownInfo) {
          dragStart = true;
          ctx.emit("dragging", {
            nodeId: mouseDownInfo.nodeId,
            newCenter: {
              x:
                mouseDownInfo.nodeCenter.x +
                event.clientX -
                mouseDownInfo.pointer.x,
              y:
                mouseDownInfo.nodeCenter.y +
                event.clientY -
                mouseDownInfo.pointer.y
            }
          });
        }
      });
      window.addEventListener("mouseup", () => {
        if (mouseDownInfo) {
          if (dragStart) {
            ctx.emit("drop", { id: mouseDownInfo.nodeId });
          } else {
            ctx.emit("click", { id: mouseDownInfo.nodeId });
          }
          dragStart = false;
          mouseDownInfo = null;
        }
      });
    });

    return {
      titleBox
    };
  },

  methods: {
    polygonToPath: polygonToPath
  }
});
</script>

<style scoped></style>
