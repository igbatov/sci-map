<template>
  <Menu />
  <Map
    :layers="layers"
    :viewBox="viewBox"
    :selectedNodeId="selectedNodeId"
    @dragging="nodeDragging"
    @click="nodeClick"
  />
</template>

<script lang="ts">
import { computed, defineComponent, watch } from "vue";
import Map from "@/components/Map.vue";
import { EventClick, EventDragging } from "@/components/Map.ts";
import Menu from "@/components/menu/Index.vue";
import { useStore } from "@/store";
import { useRouter, useRoute } from "vue-router";
import { mutations as treeMutations } from "@/store/tree";
import {filterNodesAndLayers} from "@/views/Home";
import {printError} from "@/tools/utils";

export default defineComponent({
  name: "Home",

  components: {
    Map,
    Menu
  },

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const treeState = store.state.tree;

    watch(
      () => route.params,
      () => {
        store.commit(
          `tree/${treeMutations.SET_SELECTED_NODE_ID}`,
          Number(route.params.id)
        );
      },
      { immediate: true }
    );

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
      layers: computed(() => {
        const [layers, err] = filterNodesAndLayers(
            treeState.mapNodeLayers,
            treeState.nodeRecord,
            {width: window.innerWidth, height: window.innerHeight}
          )
        if (err) {
          printError("Home.vue: error in filterNodesAndLayers:", {err})
          return {}
        }
        return layers
      }),
      viewBox,
      selectedNodeId: computed(() => treeState.selectedNodeId),
      nodeDragging: (e: EventDragging) => {
        store.commit(`tree/${treeMutations.UPDATE_NODE_POSITION}`, {
          nodeId: e.id,
          position: e.newCenter
        });
      },
      nodeClick: (e: EventClick) => {
        router.push({ name: "node", params: { id: e.id } });
      }
    };
  }
});
</script>
