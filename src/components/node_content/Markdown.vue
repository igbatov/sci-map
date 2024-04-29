<template>
  <p v-if="isAuthorized"
    v-show="!editOn"
    v-html="renderedContent"
    @click="setEditOn(true)"
    class="renderedContent"
  />
  <p v-else
    v-html="renderedContent"
    class="renderedContent"
  />
  <textarea
    class="rawContent p-inputtextarea p-inputtext p-component p-inputtextarea-resizable"
    style="display: none"
    ref="txtarea"
    :rows="rows"
    :value="content"
    @input="changeContent($event.target.value)"
    @focusout="setEditOn(false)"
  />
</template>

<script lang="ts">
import { computed, ref } from "vue";
import MarkdownIt from "markdown-it";
import {useStore} from "@/store";
const mdKatex = require('markdown-it-katex'); // eslint-disable-line
const mdImsize = require('markdown-it-imsize'); // eslint-disable-line
const mdContainer = require('markdown-it-container'); // eslint-disable-line
const mdVideo = require('markdown-it-block-embed'); // eslint-disable-line
const md = new MarkdownIt();
md.use(mdKatex, { output: "html" })
  .use(mdImsize)
  .use(mdVideo, {
    containerClassName: "video-embed",
    youtube: {
      width: 370,
      height: 209,
    }
  })
  .use(mdContainer, "warning", {
    validate: function(params: any) {
      console.log("validate", params.trim(), params.trim() == "warning");
      return params.trim().match(/^warning$/);
    },
    render: function(tokens: any, idx: any) {
      const m = tokens[idx].info.trim().match(/^warning(.*)$/);
      if (tokens[idx].nesting === 1) {
        // opening tag
        return (
          '<div style="background-color: #c6f68d; padding: 8px;">' +
          md.utils.escapeHtml(m[1]) +
          "\n"
        );
      } else {
        // closing tag
        return "</div>\n";
      }
    }
  });

export default {
  name: "Markdown",
  emits: ["content-changed"],
  props: {
    content: {
      type: String,
      required: true
    },
    rows: {
      type: Number,
      required: true
    }
  },
  setup(props: any, ctx: any) {
    const store = useStore();
    const renderedContent = computed(() => {
      return md.render(props.content);
    });
    const editOn = ref(false);

    const txtarea = ref<HTMLDivElement | null>(null);

    return {
      isAuthorized: computed(()=>store.state.user && store.state.user.user && !store.state.user.user.isAnonymous),
      editOn,
      txtarea,
      setEditOn: (val: boolean) => {
        editOn.value = val;
        if (val && txtarea.value) {
          txtarea.value.style.display = "block";
          txtarea.value.focus();
        }
        if (!val && txtarea.value) {
          txtarea.value.style.display = "none";
        }
      },
      renderedContent,
      changeContent: (value: string) => {
        ctx.emit("content-changed", value);
      }
    };
  }
};
</script>

<style scoped>
@import "../../../node_modules/katex/dist/katex.min.css";
.renderedContent {
  color: rgb(32, 33, 36);
  font-family: Roboto, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 20px;
  margin-right: 4px;
  text-align: left;
  text-wrap: wrap;
  overflow-y: scroll;
  height: 300px;
  table :is(td, th) {
    border-top: 1px solid black;
    padding: 0.3em;
  }
  table {
    border-spacing: 0;
    border-collapse: collapse;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
}
.rawContent {
  overflow-y: scroll;
  height: 100%;
}
</style>
