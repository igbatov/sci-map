<template>
  <div v-if="show && selectedNode" class="wrapper">
    <div class="p-fluid">
      <!-- Image -->
      <TitleImage
        :nodeID="selectedNodeContent ? selectedNodeContent.nodeID : ''"
      />

      <!-- Content -->
      <div class="p-field p-grid">
        <div class="p-col-12">
          <div style="height: 240px"></div>
        </div>
        <div class="p-col-10">
          <Title
            :content="selectedNodeContent ? selectedNode.title : ''"
            @content-changed="changeNodeTitle($event)"
          />
        </div>
        <div class="p-col-2">
          <PinButton />
        </div>
        <div class="p-col-12">
          <Markdown
            :content="selectedNodeContent ? selectedNodeContent.content : ''"
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
            :value="selectedNodeComment"
            @update:modelValue="changeComment($event)"
            v-on:keydown="checkAuthorized"
          />
        </div>
      </div>

      <!-- Preconditions section -->
      <div class="p-field p-grid">
        <div class="p-col-10 section">
          based on
        </div>
        <div class="p-col-2">
          <AddBasedOnButton
            :clickedTitleId="clickedTitleId"
            @select-precondition-is-on="$emit('select-precondition-is-on')"
            @select-precondition-is-off="$emit('select-precondition-is-off')"
          />
        </div>
      </div>
      <SectionPreconditions
        v-if="selectedNodeContent"
        :node-id="selectedNode.id"
      />

      <!-- 'Basis for' section -->
      <div class="p-field p-grid">
        <div class="p-col-10 section">
          basis for
        </div>
      </div>
      <SectionUsedBy v-if="selectedNodeContent" :node-id="selectedNode.id" />

      <!-- ChangeLog section -->
      <ChangeLog :node-id="selectedNode.id" />
    </div>
  </div>
  <div v-else-if="editModeOn" class="wrapper">
    <div class="p-fluid">
      <div class="p-field p-grid">
        <div class="p-col-12">
          <div style="height: 60px;"></div>
        </div>
        <div class="p-col-12">
          <div class="title">
            Map edit mode is on
          </div>
        </div>
        <div class="p-col-12 list">
          In this mode you can change map structure but cannot edit contents of individual nodes. To return back to content editing push "edit map" button again.
        </div>
        <div class="p-col-1 icon">
          <img
              alt="logo"
              src="../../assets/images/add-off.svg"
              style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          To add new node 1) select parent node on map and then 2) click "add" button in upper menu.
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/remove-off.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          To remove node 1) select it on map and 2) click "delete" button in upper menu.
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/cut.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          To move node 1) select it on map, then 2) press "cut" button, then 3) select its new parent and 4) press "paste" button.
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/log.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          You can use "log" to see log of map edits and revert or complain any unfortunate edit.
        </div>
        <div class="p-col-12 list">
            After add, paste or remove you can drag node title and its neighbours to adjust node centers position.
        </div>
      </div>
    </div>
  </div>
  <div v-else class="wrapper">
    <div class="p-fluid">
      <div class="p-field p-grid">
        <div class="p-col-12">
          <div style="height: 60px;"></div>
        </div>
        <div class="p-col-12">
          <div class="title">
            Welcome to new way of knowledge crowdsourcing!
          </div>
        </div>
        <div class="p-col-12">
          <iframe
            width="100%"
            height="225px"
            src="https://www.youtube.com/embed/4S9sDyooxf4?si=u4z2DkDwNTsVdMBH"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/sign-in.svg"
            style="width: 25px"
          />
        </div>
        <div class="p-col-11 list">
          Sign in to edit map
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/goal.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          Keep description focused and simple but profound (i - snippet with
          example of formula and image markdown)
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/plugin.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          Use <b>"based on"</b> to link nodes that are necessary for solid
          understanding of your description
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/pin-on-map.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          Pin nodes that you are focused on
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/action.svg"
            style="width: 30px"
          />
        </div>
        <div class="p-col-11 list">
          Not only description, if you know actions one can take to push
          knowledge further (vacancies, crowdsourcing etc) - add it!
        </div>
        <div class="p-col-1 icon">
          <img
            alt="logo"
            src="../../assets/images/talk.svg"
            style="width: 20px"
          />
        </div>
        <div class="p-col-11 list">
          Talk to your coauthors to make description better in
          <a
            target="_blank"
            href="https://discord.com/channels/1171118046543347782/1171118047587745953"
            >chat</a
          >
        </div>
        <div class="p-col-12 list">
          <i
            >If you thank we need more rules or change these ones, feel free to
            discuss them in community chat</i
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import { computed, defineComponent } from "vue";
import TextArea from "primevue/textarea";
import SectionPreconditions from "./Preconditions.vue";
import SectionUsedBy from "./UsedBy.vue";
import { Tree } from "@/types/graphics";
import { EmptyNodeContent, NodeContent } from "@/store/node_content";
import { clone, printError } from "@/tools/utils";
import { useConfirm } from "primevue/useconfirm";
import api from "@/api/api";
import Markdown from "./Markdown.vue";
import ChangeLog from "./ChangeLog.vue";
import PinButton from "./PinButton.vue";
import Title from "@/components/node_content/Title.vue";
import AddBasedOnButton from "@/components/node_content/AddBasedOnButton.vue";
import TitleImage from "@/components/node_content/TitleImage.vue";

export default defineComponent({
  name: "NodeContent",
  components: {
    TitleImage,
    AddBasedOnButton,
    Title,
    SectionUsedBy,
    Markdown,
    TextArea,
    SectionPreconditions,
    ChangeLog,
    PinButton
  },
  emits: ["select-precondition-is-on", "select-precondition-is-off"],
  props: {
    show: {
      type: Boolean,
      required: true
    },
    selectedNodeId: {
      type: String || null,
      validator: (prop: string | null) =>
        typeof prop === "string" || prop === null,
      required: true
    },
    clickedTitleId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const store = useStore();
    const confirm = useConfirm();
    const tree = store.state.tree;

    const selectedNode = computed<Tree | null>(() =>
      props.selectedNodeId && tree.nodeRecord[props.selectedNodeId]
        ? tree.nodeRecord[props.selectedNodeId].node
        : null
    );

    const selectedNodeContent = computed<NodeContent | null>(() => {
      if (
        props.selectedNodeId &&
        store.state.nodeContent.nodeContents[props.selectedNodeId]
      ) {
        return store.state.nodeContent.nodeContents[props.selectedNodeId];
      }
      const newContent = clone(EmptyNodeContent);
      newContent.nodeID = props.selectedNodeId;
      return newContent;
    });

    const selectedNodeComment = computed<string>(() =>
      props.selectedNodeId &&
      store.state.nodeContent.userNodeComments[props.selectedNodeId]
        ? store.state.nodeContent.userNodeComments[props.selectedNodeId].comment
        : ""
    );

    return {
      editModeOn: computed(() => store.state.editModeOn),
      selectedNode,
      selectedNodeContent,
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {confirm, message:"Please authorize to add comments and edit content"});
          e.preventDefault();
        }
      },
      selectedNodeComment,
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
});
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

  border-right: 1px solid rgb(218, 220, 224);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  clip-path: inset(0px -5px 0px 0px);
}
.title {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 1.375rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.75rem;
  color: #202124;
  margin-bottom: 20px;
}
.list {
  font-family: Roboto, Arial, sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  letter-spacing: 0;
  padding-left: 20px;
  margin-bottom: 10px;
  margin-top: 10px;
}
.icon {
  margin-top: 9px;
}
.section {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.5rem;
}
</style>
