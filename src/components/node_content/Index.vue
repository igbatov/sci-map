<template>
  <transition name="slide">
    <div v-if="show" class="wrapper">
      <h5>
        {{ selectedNode ? selectedNode.title : ""}}
      </h5>
      <div class="p-fluid">
        <div class="p-field p-grid">
          <label for="wikipedia" class="p-col-12 p-mb-2 p-md-2 p-mb-md-0">Wikipedia</label>
          <div class="p-col-12 p-md-10">
            <InputText id="wikipedia" type="text" v-model="newWikipediaLink"/>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>

import {useStore} from "@/store";
import {computed, ref, watch} from "vue";
import InputText from 'primevue/inputtext';

export default {
  name: "NodeContent",
  components: {
    InputText
  },
  props: {
    show: {
      type: Boolean,
      required: true
    },
  },
  setup(props) {
    const store = useStore();
    const tree = store.state.tree;
    const nodeContents = store.state.nodeContent.nodeContents;

    const selectedNode = computed(
        () => tree.selectedNodeId && tree.nodeRecord[tree.selectedNodeId] ?
            tree.nodeRecord[tree.selectedNodeId].node : null
    );

    const selectedNodeContent = computed(
        () => tree.selectedNodeId && nodeContents[tree.selectedNodeId] ?
            nodeContents[tree.selectedNodeId] : null
    );

    const newWikipediaLink = ref("");
    watch(
        () => tree.selectedNodeId,
        () => newWikipediaLink.value = tree.selectedNodeId && nodeContents[tree.selectedNodeId] ? nodeContents[tree.selectedNodeId].wikipedia : "",
        { immediate: true }
    );

    return {
      selectedNode,
      selectedNodeContent,
      newWikipediaLink,
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
