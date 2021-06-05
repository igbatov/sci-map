<template>
  <transition name="slide">
    <div v-if="show && selectedNode" class="wrapper">
      <h2>
        {{ selectedNode.title }}
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
        <EducationForm :resources="resources" />
        <EducationResources
          v-if="selectedNodeContent"
          :node-id="selectedNode.id"
          :resources="resources"
          :resourcesRating="selectedNodeContent.resourceRatings"
        />
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
import EducationForm from "./EducationForm.vue";
import EducationResources from "./EducationResources.vue";
import { Tree } from "@/types/graphics";
import { NodeContent } from "@/store/node_content";
import { Resources } from "@/store/resources";

export default {
  name: "NodeContent",
  components: {
    InputText,
    TextArea,
    EducationForm,
    EducationResources
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
    const nodeContents = computed<Record<string, NodeContent>>(
      () => store.state.nodeContent.nodeContents
    );

    const resources = computed<Resources>(
      () => store.state.resources.resources
    );

    const selectedNode = computed<Tree | null>(() =>
      tree.selectedNodeId && tree.nodeRecord[tree.selectedNodeId]
        ? tree.nodeRecord[tree.selectedNodeId].node
        : null
    );

    const selectedNodeContent = computed<NodeContent | null>(() =>
      tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]
        ? nodeContents.value[tree.selectedNodeId]
        : null
    );

    const newWikipediaLink = ref<string>("");
    watch(
      () => tree.selectedNodeId,
      () =>
        (newWikipediaLink.value =
          tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]
            ? nodeContents.value[tree.selectedNodeId].wikipedia
            : ""),
      { immediate: true }
    );

    return {
      resources,
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
