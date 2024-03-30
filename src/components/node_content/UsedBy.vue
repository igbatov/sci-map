<template>
  <div v-for="usedByNode of usedBy"
       :class="`p-grid ${$style.precondition} p-p-md-0`"
       :key="usedByNode.id"
  >
    <div class="p-col-12">
      <p :class="`${$style.preconditionPath}`">
        {{usedByPaths[usedByNode.id]}}
      </p>
      <p :class="`${$style.title}`">
        <Link :nodeID="usedByNode.id" :nodeTitle="usedByNode.title" />
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import {ref, watchEffect, defineComponent, PropType} from "vue";
import { useStore } from "@/store";
import { Tree } from "@/types/graphics";
import {getTreePathString} from "@/components/helpers";
import Link from "@/components/Link.vue";

export default defineComponent({
  name: "UsedBy",
  components: {
    Link,
  },
  props: {
    nodeIDs: Object as PropType<Array<string>>
  },
  setup(props) {
    const store = useStore();
    const usedBy = ref<Array<Tree>>([]);
    const usedByPaths = ref<Record<string, string>>({});
    watchEffect(() => {
      usedBy.value = [];
      usedByPaths.value = {};
      if (props.nodeIDs) {
        for (const id of props.nodeIDs) {
          if (!store.state.tree.nodeRecord[id]) {
            console.log("UsedBy: cannot find id in nodeRecord", id);
          } else {
            usedBy.value.push(store.state.tree.nodeRecord[id].node);
            usedByPaths.value[id] = getTreePathString(id, store.state.tree.nodeRecord)
          }
        }
      }
    });

    return {
      usedBy,
      usedByPaths,
    };
  }
});
</script>


<style module>
.title {
  margin: 0;
  padding: 0;
}
.precondition {
  margin: 0;
}
.precondition:hover {
  background-color: rgb(3, 219, 252, 0.2);
}
.preconditionPath {
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
</style>
