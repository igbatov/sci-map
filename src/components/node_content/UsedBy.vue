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
import { ref, watchEffect, defineComponent } from "vue";
import { useStore } from "@/store";
import { Tree } from "@/types/graphics";

export default defineComponent({
  name: "UsedBy",
  props: {
    nodeId: String
  },
  setup(props) {
    const store = useStore();
    const usedBy = ref<Array<Tree>>([]);
    watchEffect(() => {
      usedBy.value = [];
      if (props.nodeId && store.state.precondition.reverseIndex[props.nodeId]) {
        for (const id of store.state.precondition.reverseIndex[props.nodeId]) {
          usedBy.value.push(store.state.tree.nodeRecord[id].node);
        }
      }
    });

    return {
      usedBy
    };
  }
});
</script>
