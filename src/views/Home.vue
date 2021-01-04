<template>
  <Map :tree="tree" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Map from "@/components/Map.vue";
import api from "@/api.ts";
import { ref, onMounted } from "vue";

export default defineComponent({
  name: "Home",

  components: {
    Map
  },

  setup() {
    const tree = ref({});
    const getMap = async () => {
      const [apiTree, err] = await api.getMap();
      if (apiTree == null || err) {
        console.log(err);
        return;
      }
      tree.value = apiTree;
    };

    onMounted(getMap);

    return {
      tree
    };
  }
});
</script>
