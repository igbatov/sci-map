<template>
  <Map
      :layers="layers"
      :viewBox="viewBox"
      @dragging="nodeDragging"
  />
</template>

<script lang="ts">
import {computed, defineComponent} from "vue";
import Map from "@/components/Map.vue";
import { EventDragging } from "@/components/Map";
import api from "@/api.ts";
import { onMounted } from "vue";
import { useStore } from "@/store/tree";

export default defineComponent({
  name: "Home",

  components: {
    Map
  },

  setup() {
    const store = useStore();

    /**
     * Fetch map
     */
    const getMap = async () => {
      const [apiTree, err] = await api.getMap();
      if (apiTree == null || err) {
        console.error(err);
        return;
      }
      store.commit("INIT", apiTree);
    };
    onMounted(getMap);

    /**
     * compute svg viewBox
     */
    const viewBox = computed(() => {
      if (store.state.tree && store.state.tree.position) {
        return `0 0 ${2 * store.state.tree.position.x} ${2 *
        store.state.tree.position.y}`;
      } else {
        return `0 0 1000 600`;
      }
    });

    // setTimeout(()=>{
    //   store.state.tree.value.children[0].title = "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH"
    //   console.log(tree.value.children[0].title)
    // }, 7000);

    return {
      layers: computed(() => store.state.mapNodeLayers),
      viewBox,
      nodeDragging: (e: EventDragging) => {
        store.commit("UPDATE_NODE_POSITION", {
          nodeId: e.id,
          position: e.newCenter
        });
      }
    };
  }
});
</script>
