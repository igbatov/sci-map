<template>
  <Menu />
  <Map :layers="layers" :viewBox="viewBox" @dragging="nodeDragging" />
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import Map from "@/components/Map.vue";
import { EventDragging } from "@/components/Map";
import Menu from "@/components/Menu.vue";
import { useStore } from "@/store";
import { mutations as treeMutations } from "@/store/tree";

export default defineComponent({
  name: "Home",

  components: {
    Map,
    Menu
  },

  setup() {
    const store = useStore();
    const treeState = store.state.tree;

    /**
     * compute svg viewBox
     */
    const viewBox = computed(() => {
      if (treeState.tree && treeState.tree.position) {
        return `0 0 ${2 * treeState.tree.position.x} ${2 *
          treeState.tree.position.y}`;
      } else {
        return `0 0 1000 600`;
      }
    });

    return {
      layers: computed(() => treeState.mapNodeLayers),
      viewBox,
      nodeDragging: (e: EventDragging) => {
        store.commit(`tree/${treeMutations.UPDATE_NODE_POSITION}`, {
          nodeId: e.id,
          position: e.newCenter
        });
      }
    };
  }
});
</script>
