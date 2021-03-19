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
    class="text"
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
  onUnmounted,
  nextTick,
  ref,
  watch
} from "vue";
import { MapNode, Point } from "@/types/graphics";
import { polygonToPath } from "@/tools/graphics";
import { nodeToTitleBox } from "@/components/map_layer/MapLayer";

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
        // clean previous version
        for (const i in titleBox.value) {
          delete titleBox.value[i];
        }
        // fill new ones
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
    } | null = null;
    let dragStart = false;

    const mouseDownListener = (event: MouseEvent) => {
      let nodeFound = false;
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
            nodeId: Number(id)
          };
          nodeFound = true;
          break;
        }
      }

      if (!nodeFound) {
        ctx.emit("background-mouse-down", {});
      }
    };

    const mouseMoveListener = (event: MouseEvent) => {
      if (mouseDownInfo) {
        dragStart = true;
        ctx.emit("dragging", {
          nodeId: mouseDownInfo.nodeId,
          delta: {
            x: event.movementX,
            y: event.movementY
          }
        });
      }
    };

    const mouseUpListener = () => {
      if (mouseDownInfo) {
        if (dragStart) {
          ctx.emit("drop", { id: mouseDownInfo.nodeId });
        } else {
          ctx.emit("click", { id: mouseDownInfo.nodeId });
        }
        dragStart = false;
        mouseDownInfo = null;
      }
    };
    onMounted(() => {
      window.addEventListener("mousedown", mouseDownListener);
      window.addEventListener("mousemove", mouseMoveListener);
      window.addEventListener("mouseup", mouseUpListener);
    });
    onUnmounted(() => {
      window.removeEventListener("mousedown", mouseDownListener);
      window.removeEventListener("mousemove", mouseMoveListener);
      window.removeEventListener("mouseup", mouseUpListener);
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

<style scoped>
.text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
