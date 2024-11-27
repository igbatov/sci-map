<template>
  <MenuButton @click="toggleHelp">
    <img
      alt="icon"
      src="../../assets/images/help-question.svg"
      style="width: 15px; padding-top:3px; padding-bottom:2px;"
    />
  </MenuButton>
  <Dialog
    v-model:visible="isHelpVisible"
    :dismissableMask="false"
    :closable="true"
    :modal="false"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
      <h2>Help</h2>
    </template>
    <div style="width:40em;">
      <h3>Goal</h3>
      1. Collect the <b>best explanations</b> of the fundamentally important
      knowledge. It should be possible to <b>track correctness of these
      explanations</b> down to fundamental theories/experiments using
      <b>"based on"</b> feature of SciMap (see video below).<br /><br />
      2.Equally important it should take <b>the least possible time</b> to grasp the essence of the subject. People should feel there is <b>no chance to find more understandable explanations somewhere else.</b>
      Explanation at each level should contain only strictly necessary information (without nitty-gritty details of its lower levels).<br /><br />
      3. Help to <b>discover and join communities</b> that use this knowledge to solve
      hard problems.  <br /><br />SciMap should be a breath of fresh air and
      <b>guiding star</b> in the chaos of rapidly changing world and abundance of information. <br /><br />
      <div style="text-align:center">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/DuiTlnrK6G4?si=HuVA4cs5U86H9E3l"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>

      <h3>Edit content</h3>
      Everyone can edit this map (just like Wikipedia). Here is how you can do
      it.
      <br />When "edit map" mode is off
      <img src="../../assets/images/edit-map-off.png" style="height: 2em;" />
      you can edit node contents. <br />Just click on title or content and write
      your text in
      <a target="_blank" href="https://markdown-it.github.io/">markdown</a>.
      <br />
      You can use
      <a target="_blank" href="https://katex.org/docs/supported.html">katex</a>
      notation to write formulas. <br />
      - To add "based on" links between nodes,
      press plus button. <br />
      - To add video just insert link from youtube in a
      form
      <div
        style="background-color: lightgrey; width: 33em; height: 2em; padding-top:0.4em; padding-left:1em;"
      >
        @[youtube](https://www.youtube.com/watch?v=MmG2ah5Df4g)
      </div>
      - To add image click on header image, then "upload" and copy URL to
      node's content or just add any image URL in a form
      <div
        style="background-color: lightgrey; width: 33em; height: 4em; padding-top:0.8em; padding-left:1em;"
      >
        ![](https://cdn.pixabay.com/photo/2022/11/07/21/31/rose-7577265_1280.jpg
        =340x)
      </div>
      - To add comments on text quality use
      <div
          style="background-color: lightgrey; width: 33em; height: 6em; padding-top:0.4em; padding-left:1em;"
      >
      ::: warning<br>
      This assumption needs citation. Also more details on stem cell depletion should be provided.<br>
      :::
      </div>
      - To add annotation that is showed on mouse hover
      <div
          style="background-color: lightgrey; width: 33em; height: 6em; padding-top:0.4em; padding-left:1em;"
      >
      [tooltip text]{tooltip-note details ...}
      </div>
      <br />
      <br />
      <div style="text-align:center">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/7W9npc90Vp4?si=h4j3CNhG4tqLhz6z"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
      <h3>Edit map</h3>
      When "edit map" mode is on
      <img src="../../assets/images/edit-map-on.png" style="height: 2em;" /> you
      can add/remove new nodes but cannot edit node content. <br />In this mode
      click on node, then click "add", "delete" or "cut" and "paste". <br />To
      recover removed node use "log" (see video below).
      <br />
      <br />
      <div style="text-align:center">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/BVDFqjellcY?si=YJIl9mHFmI4QLezA"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
      <h3>Subscribe to changes and become an admin</h3>
      Press "eye" button to receive node updates on email. You can receive
      changes daily or weekly, track unfortunate edits and ban users.
      <br />
      <br />
      <div style="text-align:center">
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/eDrhDCze7LY?si=dFLEHd10Kw_xsKDs"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
      <br />
    </div>
  </Dialog>
</template>

<script lang="ts">
import Dialog from "primevue/dialog";
import { defineComponent, ref } from "vue";
import MenuButton from "@/components/menu/MenuButton.vue";

export default defineComponent({
  name: "Help",
  components: {
    MenuButton,
    Dialog
  },
  setup() {
    const isHelpVisible = ref(false);

    return {
      toggleHelp: () => (isHelpVisible.value = !isHelpVisible.value),
      isHelpVisible
    };
  }
});
</script>
