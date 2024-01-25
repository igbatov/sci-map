<template>
  <transition name="slide">
      <div v-if="show && selectedNode" class="wrapper">
        <div class="p-fluid">
          <!-- Content   -->
          <div class="p-field p-grid">
            <div class="p-col-12">
              <TextArea
                rows="1"
                :autoResize="true"
                placeholder="Node title"
                :value="selectedNode.title"
                @update:modelValue="changeNodeTitle($event)"
              />
            </div>
            <div class="p-col-12">
              <Markdown
                :content = "selectedNodeContent ? selectedNodeContent.content : ''"
                :rows="20"
                @content-changed="changeContent($event)"
              />
            </div>
          </div>

          <!-- Comment -->
          <div class="p-field p-grid">
            <div class="p-col-12 p-md-12">
            <TextArea
                id="comment"
                placeholder="Your notes (visible only to you)"
                :autoResize="true"
                rows="2"
                :value="comment"
                @update:modelValue="changeComment($event)"
                v-on:keydown="checkAuthorized"
            />
            </div>
          </div>

          <!-- Preconditions section -->
          <h3><i>based on</i></h3>
          <SectionPreconditions
              v-if="selectedNodeContent"
              :node-id="selectedNode.id"
          />

          <!-- Used by section -->
          <h3><i>used by</i></h3>
          <SectionUsedBy
              v-if="selectedNodeContent"
              :node-id="selectedNode.id"
          />

          <!-- ChangeLog section -->
          <ChangeLog :node-id="selectedNode.id" />
        </div>
      </div>

  </transition>
</template>

<script lang="ts">
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import { computed } from "vue";
import TextArea from "primevue/textarea";
import SectionPreconditions from "./Preconditions.vue";
import SectionUsedBy from "./UsedBy.vue";
import { Tree } from "@/types/graphics";
import {
  EmptyNodeContent,
  NodeComment,
  NodeContent
} from "@/store/node_content";
import { clone, printError } from "@/tools/utils";
import { useConfirm } from "primevue/useconfirm";
import api from "@/api/api";
import Markdown from "./Markdown.vue";
import ChangeLog from "./ChangeLog.vue";

export default {
  name: "NodeContent",
  components: {
    SectionUsedBy,
    Markdown,
    TextArea,
    SectionPreconditions,
    ChangeLog,
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
      selectedNode,
      selectedNodeContent,
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      comment,
      changeNodeTitle: async (value: string) => {
        if (!selectedNode.value || !selectedNode.value.id) {
          return;
        }
        const err = await api.debouncedUpdate({
          [`map/${selectedNode.value.id}/name`]: value
        });

        if (err) {
          printError(err.error.message, err.kv);
        }
      },
      changeContent: async (value: string) => {
        const err = await store.dispatch(
          `nodeContent/${nodeContentActions.setNodeContent}`,
          {
            nodeID: selectedNode.value!.id,
            content: value
          }
        );

        if (err) {
          printError(err, {});
        }
      },
      changeComment: async (value: string) => {
        const err = await store.dispatch(
          `nodeContent/${nodeContentActions.setNodeComment}`,
          {
            nodeID: selectedNode.value!.id,
            comment: value
          }
        );

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
  width: 30%;
  height: 100%;
  padding: 24px;
  overflow-y: scroll;
  background-color: rgba(255, 255, 255, 1);
  font-family: Roboto, Arial, sans-serif;
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
