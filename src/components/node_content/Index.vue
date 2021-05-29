<template>
  <transition name="slide">
    <div v-if="show" class="wrapper">
      <h2>
        {{ selectedNode ? selectedNode.title : "" }}
      </h2>
      <div class="p-fluid">
        <!-- Video -->
        <div class="p-field p-grid">
          <label for="video" class="p-col-2 p-mb-0">Video</label>
          <div class="p-col-10">
            <InputText
              id="video"
              type="text"
              placeholder="https://www.youtube.com/embed/OmJ-4B-mS-Y"
              v-model="newWikipediaLink"
            />
          </div>
        </div>
        <!--   wikipedia   -->
        <div class="p-field p-grid">
          <label for="wikipedia" class="p-col-2 p-mb-0">Wikipedia</label>
          <div class="p-col-10">
            <InputText
              id="wikipedia"
              type="text"
              placeholder="https://en.wikipedia.org/wiki/Mathematics"
              v-model="newWikipediaLink"
            />
          </div>
        </div>
        <!-- Comment -->
        <div class="p-field p-grid">
          <label for="comment" class="p-col-2 p-mb-0">Comment</label>
          <div class="p-col-12 p-md-10">
            <TextArea
              id="comment"
              placeholder="Your personal comment (visible only for you)"
              :autoResize="true"
              rows="2"
              v-model="newWikipediaLink"
            />
          </div>
        </div>

        <!-- Education section -->
        <Education />

        <!-- Internship section -->
        <h3>Internship</h3>
        <!-- Job section -->
        <h3>Vacancies</h3>
        <!-- Crowdfunding section -->
        <h3>Crowdfunding</h3>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { computed, ref, watch } from "vue";
import InputText from "primevue/inputtext";
import TextArea from "primevue/textarea";
import Education from "./Education";

export default {
  name: "NodeContent",
  components: {
    InputText,
    TextArea,
    Education
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const store = useStore();
    const tree = store.state.tree;
    const nodeContents = store.state.nodeContent.nodeContents;

    const selectedNode = computed(() =>
      tree.selectedNodeId && tree.nodeRecord[tree.selectedNodeId]
        ? tree.nodeRecord[tree.selectedNodeId].node
        : null
    );

    const selectedNodeContent = computed(() =>
      tree.selectedNodeId && nodeContents[tree.selectedNodeId]
        ? nodeContents[tree.selectedNodeId]
        : null
    );

    const newWikipediaLink = ref("");
    watch(
      () => tree.selectedNodeId,
      () =>
        (newWikipediaLink.value =
          tree.selectedNodeId && nodeContents[tree.selectedNodeId]
            ? nodeContents[tree.selectedNodeId].wikipedia
            : ""),
      { immediate: true }
    );

    return {
      selectedNode,
      selectedNodeContent,
      newWikipediaLink
    };
  }
};
</script>

<style scoped>
.wrapper {
  position: absolute;
  width: 40%;
  height: 100%;
  padding: 8px;
  background-color: rgba(255, 255, 255, 1);
  font-family: Roboto;
  color: rgb(73, 80, 87);
}

.slide-enter-active,
.slide-leave-active {
  transition: left 0.5s;
}

.slide-leave-from,
.slide-enter-to {
  left: 0;
}

.slide-enter-from,
.slide-leave-to {
  left: -100%;
}
</style>
