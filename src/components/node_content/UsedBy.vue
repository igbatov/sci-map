<template>
  <div v-for="usedByNode of usedBy" class="p-grid" :key="usedByNode.id">
    <div class="p-col-12">
      <div class="p-grid">
        <div class="p-col-11">
          <a :href="usedByNode.id">{{ usedByNode.title }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {ref, watchEffect, defineComponent, PropType} from "vue";
import { useStore } from "@/store";
import { Tree } from "@/types/graphics";

export default defineComponent({
  name: "UsedBy",
  props: {
    nodeIDs: Object as PropType<Array<string>>
  },
  setup(props) {
    const store = useStore();
    const usedBy = ref<Array<Tree>>([]);
    watchEffect(() => {
      usedBy.value = [];
      if (props.nodeIDs) {
        for (const id of props.nodeIDs) {
          if (!store.state.tree.nodeRecord[id]) {
            console.log("UsedBy: cannot find id in nodeRecord", id);
          } else {
            usedBy.value.push(store.state.tree.nodeRecord[id].node);
          }
        }
      }
    });

    return {
      usedBy
    };
  }
});
</script>
