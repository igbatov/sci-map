<template>
  <div
    v-if="show && selectedNode"
    :class="`${wrapperClass()}`"
    :style="!isWideScreen() ? `height:${wrapperHeight}px;` : ''"
    id="contentBox"
  >
    <div class="p-fluid">
      <!-- Image -->
      <TitleImage
        v-if="isWideScreen()"
        :nodeID="selectedNodeContent ? selectedNodeContent.nodeID : ''"
        :nodeContent="selectedNodeContent ? selectedNodeContent.content : ''"
      />

      <!-- Content -->
      <div class="p-field p-grid">
        <div v-if="isWideScreen()" class="p-col-12">
          <div style="height: 240px"></div>
        </div>
        <div class="p-col-9">
          <div class="p-grid">
            <div class="p-col-12">
              <Title
                  :content="selectedNodeContent ? selectedNode.title : ''"
                  @content-changed="changeNodeTitle($event)"
              />
            </div>
          </div>
        </div>
        <div class="p-col-1">
          <SubscribeButton
            :nodeID="selectedNodeContent ? selectedNodeContent.nodeID : ''"
          />
        </div>
        <div class="p-col-2">
          <PinButton />
        </div>
        <div class="p-col-4">
          <MenuButton @click="basedOnClick" width="6.7rem">
            <span class="p-ml-2">based on</span>
          </MenuButton>
        </div>
        <div class="p-col-5">
          <MenuButton @click="myCommentsClick" width="8.7rem">
            <span class="p-ml-2">my comments</span>
          </MenuButton>
        </div>
        <div class="p-col-12">
          <hr style="margin-top: 2rem;"/>
        </div>
        <div class="p-col-12">
          <Markdown
            :content="selectedNodeContent ? selectedNodeContent.content : ''"
            :allowEdit="true"
            @content-changed="changeContent($event)"
            :editClickBegin="editClickBegin"
            :editClickFinish="editClickFinish"
          />
        </div>
      </div>

      <hr/>

      <!-- 'Based on' section -->
      <div class="p-grid" id="basedOnSection">
        <div :class="`p-col-10 ${$style.section} p-pt-2`">
          Based on
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
      <div v-if="selectedNodeContent && usedBy && usedBy.length > 0">
        <div class="p-field p-grid">
          <div :class="`p-col-12 ${$style.section} p-pt-5`">
            Basis for
          </div>
        </div>
        <SectionUsedBy :nodeIDs="usedBy" />
      </div>

      <hr/>

      <!-- Comment -->
      <div class="p-field p-grid" id="myCommentsSection">
        <div :class="`p-col-10 ${$style.section} p-pt-2`">
          My comments
        </div>
        <div class="p-col-12 p-md-12">
          <TextArea
            id="comment"
            placeholder="Personal notes. DO NOT WRITE SENSITIVE INFORMATION HERE! (on scimap.org your notes will be visible only to you, but anyone can get access to it from publicly available backups)"
            :autoResize="true"
            rows="2"
            :value="selectedNodeComment"
            @update:modelValue="changeComment($event)"
            v-on:keydown="checkAuthorized"
          />
        </div>
      </div>

      <!-- ChangeLog section -->
      <ChangeLog :node-id="selectedNode.id" />
    </div>
  </div>
  <div
    v-else-if="editModeOn"
    :class="`${wrapperClass()}`"
    :style="!isWideScreen() ? `height:${wrapperHeight}px;` : ''"
  >
    <div class="p-fluid">
      <div class="p-field p-grid">
        <div class="p-col-12">
          <div style="height: 60px;"></div>
        </div>
        <div class="p-col-12">
          <div :class="$style.title">
            Map edit mode is on
          </div>
        </div>
        <div :class="`p-col-12 ${$style.list}`">
          In this mode you can change map structure but cannot edit contents of
          individual nodes. To return back to content editing push "edit map"
          button again.
        </div>
        <div :class="`p-col-1 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/add-off.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-11 ${$style.list}`">
          To add new node 1) select parent node on map and then 2) click "add"
          button in upper menu.
        </div>
        <div :class="`p-col-1 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/remove-off.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-11 ${$style.list}`">
          To remove node 1) select it on map and 2) click "delete" button in
          upper menu.
        </div>
        <div :class="`p-col-1 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/cut.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-11 ${$style.list}`">
          To move node 1) select it on map, then 2) press "cut" button, then 3)
          select its new parent and 4) press "paste" button.
        </div>
        <div :class="`p-col-1 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/log.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-11 ${$style.list}`">
          You can use "log" to see log of map edits and revert or complain any
          unfortunate edit.
        </div>
        <div :class="`p-col-12 ${$style.list}`">
          After add, paste or remove you can drag node title and its neighbours
          to adjust node centers position.
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    :class="`${wrapperClass()}`"
    :style="!isWideScreen() ? `height:${wrapperHeight}px;` : ''"
  >
    <div class="p-fluid">
      <div class="p-field p-grid">
        <div v-if="isWideScreen()" class="p-col-12">
          <div style="height: 60px;"></div>
        </div>
        <div class="p-col-12" style="margin-bottom:2em;">
          <iframe
            width="100%"
            src="https://www.youtube.com/embed/DuiTlnrK6G4?si=HuVA4cs5U86H9E3l"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
        <div :class="`${$style.list}`">
          The goal of the project is to
          <br /><br />1. Collect the <b>best explanations</b> of the
          fundamentally important knowledge. It should be possible to track
          correctness of these explanations down to fundamental
          theories/experiments using <b>"based on"</b> feature of SciMap (see
          video above). <br /><br />2. Help to
          <b>discover and join communities</b> that use this knowledge to solve
          hard problems of humanity. <br /><br />When everyone in tech goes
          crazy on AI and blockchain it seems that we should invest more in
          platform that can help to navigate in exponential abundance of
          information generated by AI and to find new meaningful jobs in a new
          reality. SciMap should be a breath of fresh air and
          <b>guiding star</b> in the chaos of rapidly changing world.

          <br /><br />Here are the features:
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/sign-in.svg"
            style="width: 25px"
          />
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Sign in to edit map
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/goal.svg"
            style="width: 30px"
          />
        </div>
        <div
          v-tooltip="{
            escape: false,
            autoHide: false,
            pt: {
              root: {
                style: {
                  'max-width': 'fit-content'
                }
              },
              arrow: {
                style: {
                  borderRightColor: '#dcdcde',
                  borderBottomColor: 'rgb(255 255 255 / 0)',
                  borderTopColor: 'rgb(255 255 255 / 0)'
                }
              },
              text: {
                style: {
                  'background-color': '#dcdcde',
                  color: 'black'
                }
              }
            },
            value: `
<div style='padding-left: 20px; width:410px;height:600px;'>
  Use <a target='_blank' href='https://markdown-it.github.io/'>markdown</a> to format text
  and <a target='_blank' href='https://katex.org/docs/supported.html'>katex</a> notation to write formulas.
 For example write
 <textarea rows='3' cols='43'>$$
\\sum_{\\mathclap{1\\le i\\le j\\le n}} x_{ij}
$$</textarea>
  to render formula:
  ${md.render(`$$
\\sum_{\\mathclap{1\\le i\\le j\\le n}} x_{ij}
$$`)}
  <div style='margin-top: -4em;'>
  Or write
   <textarea rows='5' cols='43'>
   ![](https://cdn.scimap.org/images/default.jpg =340x)
   @[youtube](https://www.youtube.com/watch?v=E8YCQ0zjCZA)
   </textarea>
   to insert image or video:
   ${md.render(`@[youtube](https://www.youtube.com/watch?v=E8YCQ0zjCZA)`)}
   </div>
</div>`
          }"
          :class="`p-col-10 ${$style.list}`"
        >
          Keep node content <b>focused and simple but profound</b> (you can use
          <a target="_blank" href="https://markdown-it.github.io/">markdown</a>
          and
          <a target="_blank" href="https://katex.org/docs/supported.html"
            >katex</a
          >&nbsp;<img
            alt="logo"
            src="../../assets/images/question.svg"
            style="width: 20px; margin-bottom:-5px;"
          />). We are focusing on <b>quality and pithiness</b> of content.
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/plugin.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Use <b>"based on"</b> to link nodes that are necessary for solid
          understanding of your description
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/chat.svg"
            style="width: 20px"
          />
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Talk to your coauthors in
          <a
            target="_blank"
            href="https://discord.com/channels/1171118046543347782/1171118047587745953"
            >chat</a
          >
          to adapt community rules and create a great content
        </div>
        <div
          :class="`p-col-2 ${$style.icon}`"
          style="color: #3B6BF9; padding-left:10px; font-weight: bold; font-size:1.5em;"
        >
          W
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Use Wikipedia core content policies: neutral point of view,
          verifiability, and no original research
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/pin-on.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Pin nodes that you are currently interested in
        </div>
        <div :class="`p-col-2 ${$style.icon}`">
          <img
            alt="logo"
            src="../../assets/images/eye-on.svg"
            style="width: 30px"
          />
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Subscribe to node changes to receive updates on email
        </div>
        <div :class="`p-col-2 ${$style.icon}`" style="color: #3B6BF9;">
          [ORG]
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          If you know actions one can take to push knowledge further (jobs,
          crowdsourcing, etc.) - you can also add it!
        </div>
        <div :class="`p-col-2 ${$style.icon}`" style="color: #3B6BF9;">
          Open
        </div>
        <div :class="`p-col-10 ${$style.list}`">
          Project is
          <a target="_blank" href="https://github.com/igbatov/sci-map"
            >open source</a
          >
          and data is
          <a
            target="_blank"
            href="https://github.com/igbatov/scimap-backup-list/blob/main/backup-list.json"
            >publicly available</a
          >
          on <b>decentralized storage</b> in JSON format
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import { computed, defineComponent, useCssModule } from "vue";
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
import SubscribeButton from "./SubscribeButton.vue";
import Title from "@/components/node_content/Title.vue";
import AddBasedOnButton from "@/components/node_content/AddBasedOnButton.vue";
import TitleImage from "@/components/node_content/TitleImage.vue";
import MarkdownIt from "markdown-it";
import { isWideScreen } from "../helpers";
import { add as textSearchAdd, SearchFieldName } from "@/tools/textsearch";
import MenuButton from "@/components/menu/MenuButton.vue";
const mdKatex = require('markdown-it-katex'); // eslint-disable-line
const mdImsize = require('markdown-it-imsize'); // eslint-disable-line
const mdVideo = require('markdown-it-block-embed'); // eslint-disable-line
const md = new MarkdownIt();
md.use(mdKatex, { output: "html" })
  .use(mdImsize)
  .use(mdVideo, {
    containerClassName: "video-embed",
    youtube: {
      width: 370,
      height: 209
    }
  });

export default defineComponent({
  name: "NodeContent",
  components: {
    MenuButton,
    TitleImage,
    AddBasedOnButton,
    Title,
    SectionUsedBy,
    Markdown,
    TextArea,
    SectionPreconditions,
    ChangeLog,
    PinButton,
    SubscribeButton
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
    },
    wrapperHeight: {
      type: Number,
      required: false
    }
  },
  setup(props) {
    const $style = useCssModule();
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

    let contentBoxScrollTop = 0;
    return {
      editClickBegin: () => {
        const contentBox = document.getElementById("contentBox");
        if (contentBox) {
          contentBoxScrollTop = contentBox.scrollTop
        }
      },
      editClickFinish: () => {
        const contentBox = document.getElementById("contentBox");
        if (contentBox) {
          setTimeout(()=>{
            contentBox.scrollTop = contentBoxScrollTop+1
          }, 0);
        }
      },
      md,
      usedBy: computed(
        () => store.state.precondition.reverseIndex[props.selectedNodeId]
      ),
      editModeOn: computed(() => store.state.editModeOn),
      selectedNode,
      selectedNodeContent,
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {
            confirm,
            message: "Please authorize to add comments and edit content"
          });
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
        textSearchAdd(
          selectedNode.value!.id,
          SearchFieldName.UserComment,
          value
        );
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
      },
      isWideScreen,
      wrapperClass: () => {
        return isWideScreen()
          ? $style.wrapperContent
          : $style.wrapperContentMobile;
      },
      basedOnClick: () => {
        const contentBox = document.getElementById('contentBox');
        const scrollToSection = document.getElementById('basedOnSection');
        if (contentBox && scrollToSection) {
          contentBox.scrollTop = scrollToSection.offsetTop;
        }
      },
      myCommentsClick: () => {
        const contentBox = document.getElementById('contentBox');
        const scrollToSection = document.getElementById('myCommentsSection');
        if (contentBox && scrollToSection) {
          contentBox.scrollTop = scrollToSection.offsetTop;
        }
      },
    };
  }
});
</script>

<style module>
.wrapperContentMobile {
  z-index: 10;
  padding: 24px;
  background-color: rgba(255, 255, 255, 1);
  font-family: Roboto, Arial, sans-serif;
  color: rgb(73, 80, 87);
  overflow-y: scroll;
  scroll-behavior: smooth;
}
.wrapperContent {
  z-index: 10;
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
  scroll-behavior: smooth;
}
.title {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 1.25rem;
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

hr {
  border: 0;
  height: 1px;
  background: rgb(218, 220, 224);
}
</style>
