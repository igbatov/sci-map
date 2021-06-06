<template>
  <transition name="slide">
    <div v-if="show && selectedNode" class="wrapper">
      <h2>
        {{ selectedNode.title }}
      </h2>
      <div class="p-fluid">
        <!-- Video -->
        <div class="p-field p-grid">
          <div class="p-col-12">
            <InputText
              id="video"
              type="text"
              placeholder="https://www.youtube.com/embed/OmJ-4B-mS-Y"
              :value="videoURL"
              @update:modelValue="changeVideoURL($event)"
            />
          </div>
        </div>
        <!--   wikipedia   -->
        <div class="p-field p-grid">
          <div class="p-col-12">
            <InputText
              id="wikipedia"
              type="text"
              placeholder="https://en.wikipedia.org/wiki/Mathematics"
              :value="wikipediaURL"
              @update:modelValue="changeWikipediaURL($event)"
            />
          </div>
        </div>
        <!-- Comment -->
        <div class="p-field p-grid">
          <div class="p-col-12 p-md-12">
            <TextArea
              id="comment"
              placeholder="Your personal comment"
              :autoResize="true"
              rows="2"
              :value="comment"
              @update:modelValue="changeComment($event)"
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
import {actions, useStore} from "@/store";
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

    const wikipediaURL = computed<string>(() =>
        tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]
            ? nodeContents.value[tree.selectedNodeId].wikipedia
            : ""
    );

    const videoURL = computed<string>(() =>
        tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]
            ? nodeContents.value[tree.selectedNodeId].video
            : ""
    );

    const comment = computed<string>(() =>
        tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]
            ? nodeContents.value[tree.selectedNodeId].comment
            : ""
    );

    return {
      resources,
      selectedNode,
      selectedNodeContent,
      videoURL,
      changeVideoURL: (value: string) => {
         store.dispatch(`${actions.setNodeVideo}`, {
          nodeID: selectedNode.value!.id,
          video: value,
        });
      },
      wikipediaURL,
      changeWikipediaURL: (value: string) => {
        store.dispatch(`${actions.setNodeWikipedia}`, {
          nodeID: selectedNode.value!.id,
          wikipedia: value,
        });
      },
      comment,
      changeComment: (value: string) => {
        store.dispatch(`${actions.setNodeComment}`, {
          nodeID: selectedNode.value!.id,
          comment: value,
        });
      }
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
