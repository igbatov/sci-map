<template>
  <Map @dragging="nodeDragging" />
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
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

    const getMap = async () => {
      const [apiTree, err] = await api.getMap();
      if (apiTree == null || err) {
        console.error(err);
        return;
      }
      store.commit("init", apiTree);
    };

    onMounted(getMap);

    return {
      nodeDragging: (e: EventDragging) => {
        store.commit("updateNodePosition", {
          nodeId: e.id,
          position: e.newCenter
        });
      }
    };
  }
});
</script>
