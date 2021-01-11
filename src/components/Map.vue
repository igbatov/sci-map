<template>
  <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox">
    <MapLayer
      v-for="(layer, i) of layers"
      :key="i"
      :map-nodes="layer"
      :border-color="`rgb(${200 - 100 * i},${200 - 100 * i},${200 - 100 * i})`"
      :font-size="10 * (i + 1)"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType, watch, toRefs, ref, computed } from "vue";
import { Tree } from "@/types/graphics";
import MapLayer from "@/components/MapLayer.vue";
import { mapToLayers } from "@/tools/graphics";

export default defineComponent({
  name: "Map",
  components: {
    MapLayer
  },
  props: {
    tree: {
      type: Object as PropType<Tree>,
      required: true
    }
  },
  setup(props) {
    const { tree } = toRefs(props);
    const layers = ref({});

    /**
     * treeToLayers processor
     */
    const treeToLayers = () => {
      const [ls, err] = mapToLayers(tree.value);
      if (ls == null || err != null) {
        console.error(err);
        return;
      }
      ls.reverse();
      layers.value = ls;
    };
    watch(tree, treeToLayers);

    /**
     * svg viewBox processor
     */
    const viewBox = computed(() => {
      if (tree.value.position) {
        return `0 0 ${2 * tree.value.position.x} ${2 * tree.value.position.y}`;
      } else {
        return `0 0 1000 600`;
      }
    });

    return {
      layers,
      viewBox
    };
  }
});
</script>

<style scoped></style>
