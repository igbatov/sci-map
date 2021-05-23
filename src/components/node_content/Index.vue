<template>
  <transition name="slide">
    <div v-if="selectedNode" class="wrapper">
      {{ selectedNode ? selectedNode.title : ""}}
    </div>
  </transition>
</template>

<script>

import {useStore} from "@/store";
import {computed} from "vue";

export default {
  name: "NodeContent",
  components: {

  },
  setup() {
    const store = useStore();
    const tree = store.state.tree;

    // user info
    const selectedNode = computed(
        () => tree.selectedNodeId && tree.nodeRecord[tree.selectedNodeId] ?
            tree.nodeRecord[tree.selectedNodeId].node : null
    );

    return {
      selectedNode,
    }
  }
};
</script>

<style scoped>
.wrapper {
  position: absolute;
  width: 60%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  background-color: rgba(255, 255, 255, 1);
}

.slide-enter-active,
.slide-leave-active {
  transition: left 0.5s;
}

.slide-leave-from, .slide-enter-to {
  left: 0;
}

.slide-enter-from, .slide-leave-to {
  left: -100%;
}

</style>
