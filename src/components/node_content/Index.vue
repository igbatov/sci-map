<template>
  <transition name="slide">
    <div v-if="show && selectedNode" class="wrapper">
      <h2>
        {{ selectedNode.title }}
      </h2>
      <div class="p-fluid">

        <!-- Content   -->
        <div class="p-field p-grid">
          <div class="p-col-12">
            <TextArea
                id="content"
                placeholder="Description"
                :autoResize="true"
                rows="20"
                :value="selectedNodeContent ? selectedNodeContent.content : ''"
                @update:modelValue="changeContent($event)"
                v-on:keydown="checkAuthorized"
            />
          </div>
        </div>

        <!-- sources -->
        <h3>Sources</h3>
        <SectionResources
            v-if="selectedNodeContent"
            :node-id="selectedNode.id"
            :resources="resources"
            :resourceIds="selectedNodeContent.resourceIds"
        />

        <!-- Preconditions section -->
        <h3>Preconditions</h3>
        <SectionPreconditions
          v-if="selectedNodeContent"
          :node-id="selectedNode.id"
        />

        <!-- Comment -->
        <h3>Your personal comment</h3>
        <div class="p-field p-grid">
          <div class="p-col-12 p-md-12">
            <TextArea
                id="comment"
                placeholder="Your personal comment"
                :autoResize="true"
                rows="2"
                :value="comment"
                @update:modelValue="changeComment($event)"
                v-on:keydown="checkAuthorized"
            />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import { computed } from "vue";
import TextArea from "primevue/textarea";
import SectionResources from "./resources/Index.vue";
import SectionPreconditions from "./Preconditions.vue";
import { Tree } from "@/types/graphics";
import {EmptyNodeContent, NodeComment, NodeContent} from "@/store/node_content";
import { Resources } from "@/store/resources";
import { clone, printError } from "@/tools/utils";
import { useConfirm } from "primevue/useconfirm";

export default {
  name: "NodeContent",
  components: {
    TextArea,
    SectionResources,
    SectionPreconditions
  },
  props: {
    show: {
      type: Boolean,
      required: true
    }
  },
  setup() {
    const store = useStore();
    const confirm = useConfirm();
    const tree = store.state.tree;
    const nodeContents = computed<Record<string, NodeContent>>(
      () => store.state.nodeContent.nodeContents
    );
    const userNodeComments = computed<Record<string, NodeComment>>(
      () => store.state.nodeContent.userNodeComments
    );

    const resources = computed<Resources>(
      () => store.state.resources.resources
    );

    const selectedNode = computed<Tree | null>(() =>
      tree.selectedNodeId && tree.nodeRecord[tree.selectedNodeId]
        ? tree.nodeRecord[tree.selectedNodeId].node
        : null
    );

    const selectedNodeContent = computed<NodeContent | null>(() => {
      if (tree.selectedNodeId && nodeContents.value[tree.selectedNodeId]) {
        return nodeContents.value[tree.selectedNodeId];
      }
      const newContent = clone(EmptyNodeContent);
      newContent.nodeID = tree.selectedNodeId;
      return newContent;
    });

    const comment = computed<string>(() =>
      tree.selectedNodeId && userNodeComments.value[tree.selectedNodeId]
        ? userNodeComments.value[tree.selectedNodeId].comment
        : ""
    );

    return {
      resources,
      selectedNode,
      selectedNodeContent,
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      comment,
      changeContent: async (value: string) => {
        const err = await store.dispatch(`nodeContent/${nodeContentActions.setNodeContent}`, {
          nodeID: selectedNode.value!.id,
          content: value
        });

        if (err) {
          printError(err, {});
        }
      },
      changeComment: async (value: string) => {
        const err = await store.dispatch(`nodeContent/${nodeContentActions.setNodeComment}`, {
          nodeID: selectedNode.value!.id,
          comment: value
        });

        if (err) {
          printError(err, {});
        }
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
