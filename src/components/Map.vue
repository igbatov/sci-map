<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <MapLayer
      v-for="(layer, i) of layers"
      :key="i"
      :map-nodes="layer"
      :border-color="`rgb(${200 - 100 * i},${200 - 100 * i},${200 - 100 * i})`"
      :font-size="10 * (i + 1)"
      @dragging="
        $emit('dragging', {
          level: layers.length - i,
          id: $event.nodeId,
          newCenter: $event.newCenter
        })
      "
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, toRefs, ref, computed } from "vue";
import { Tree } from "@/types/graphics";
import MapLayer from "@/components/MapLayer.vue";
import { useStore } from "@/store/tree";

export default defineComponent({
  name: "Map",
  emits: ["dragging"],
  components: {
    MapLayer
  },
  props: {},
  setup() {
    const store = useStore();

    // setTimeout(()=>{
    //   tree.value.children[0].title = "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH"
    //   console.log(tree.value.children[0].title)
    // }, 7000);

    /**
     * svg viewBox processor
     */
    const viewBox = computed(() => {
      if (store.getters.getTree && store.getters.getTree.position) {
        return `0 0 ${2 * store.getters.getTree.position.x} ${2 *
          store.getters.getTree.position.y}`;
      } else {
        return `0 0 1000 600`;
      }
    });

    return {
      layers: computed(() => store.getters.getMapNodeLayers),
      viewBox
    };
  }
});
</script>

<style scoped></style>
