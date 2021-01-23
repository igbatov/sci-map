<template>
  <Menu />
  <Map :layers="layers" :viewBox="viewBox" @dragging="nodeDragging" />
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import Map from "@/components/Map.vue";
import { EventDragging } from "@/components/Map";
import Menu from "@/components/Menu.vue";
import api from "@/api/api";
import { onMounted } from "vue";
import { useStore } from "@/store";
import { actions } from "@/store/tree";

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
     * Fetch map
     */
    const getMap = async () => {
      const [apiTree, err] = await api.getMap();
      if (apiTree == null || err) {
        console.error(err);
        return;
      }
      store.commit(`tree/${actions.INIT}`, apiTree);
    };
    onMounted(getMap);

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

    // setTimeout(()=>{
    //   treeStore.state.tree.value.children[0].title = "HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH"
    //   console.log(tree.value.children[0].title)
    // }, 7000);

    return {
      layers: computed(() => treeState.mapNodeLayers),
      viewBox,
      nodeDragging: (e: EventDragging) => {
        store.commit(`tree/${actions.UPDATE_NODE_POSITION}`, {
          nodeId: e.id,
          position: e.newCenter
        });
      }
    };
  }
});
</script>
