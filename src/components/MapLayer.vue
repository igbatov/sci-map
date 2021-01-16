<template>
  <polygon
    v-for="(mapNode, i) of mapNodes"
    :key="i"
    :stroke="borderColor"
    fill="transparent"
    stroke-width="2"
    :points="polygonToPath(mapNode.border)"
  />
  <circle
      v-for="mapNode of mapNodes"
      :key="mapNode.id"
      :cx="mapNode.center.x"
      :cy="mapNode.center.y"
      r="10"
      stroke="black"
      stroke-width="1"
      fill="red"
  />
  <text
    v-for="mapNode of mapNodes"
    :id="`title_${mapNode.id}`"
    :key="mapNode.id"
    :x="titleBox[mapNode.id].position.x"
    :y="titleBox[mapNode.id].position.y"
    font-family="Roboto"
    :font-size="fontSize"
    :fill="borderColor"
  >
    {{ mapNode.title }}
  </text>
</template>

<script lang="ts">
import {defineComponent, PropType, toRefs, onMounted, onUpdated, nextTick, ref, watch, Ref} from "vue";
import {MapNode, Point} from "@/types/graphics";
import { polygonToPath } from "@/tools/graphics";
import {nodeToTitleBox} from "@/components/MapLayer";

export default defineComponent({
  name: "MapLayer",
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
    }
  },

  setup(props, ctx){
    const { mapNodes } = toRefs(props);

    /**
     * Update titleBox on evenry prop change after DOM rerender
     */
    const titleBox = ref(nodeToTitleBox(mapNodes))
    const titleXYUpdate = (mapNodes: Array<MapNode>) => {
      // Code that will run only after the entire view has been rendered
      nextTick(() => {
        for (const i in mapNodes) {
          const node = mapNodes[i]
          const dom = document.getElementById(`title_${node.id}`)
          if (dom == null) {
            continue
          }
          titleBox.value[node.id] = {
            position: {
              x:node.center.x - dom.getBoundingClientRect().width/2,
              y:node.center.y + dom.getBoundingClientRect().height/4,
            },
            bbox: {
              width: dom.getBoundingClientRect().width,
              height: dom.getBoundingClientRect().height,
            }
          }
        }
      })
    }
    watch(
      () => props.mapNodes,
      (mapNodes) => titleXYUpdate(mapNodes),
      {
        immediate: true,
      },
    )

    /**
     * Send event on titleBox click, drag and drop
     */
    return {
      titleBox
    }
  },

  methods: {
    polygonToPath: polygonToPath
  }
});
</script>

<style scoped></style>
