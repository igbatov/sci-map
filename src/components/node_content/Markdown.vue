<template>
  <p
    v-if="isAuthorized"
    v-show="!editOn"
    v-html="renderedContent"
    @click="setEditOn(true)"
    class="renderedContent"
    :style="contentHeight ? `height: ${contentHeight}; margin-bottom: 0;` : ''"
  />
  <p
    v-else
    v-html="renderedContent"
    class="renderedContent"
    :style="contentHeight ? `height: ${contentHeight}; margin-bottom: 0;` : ''"
  />
  <textarea
    class="rawContent p-inputtextarea p-inputtext p-component p-inputtextarea-resizable"
    style="display: none"
    ref="txtarea"
    :rows="rows ? rows : 1"
    :value="content"
    @input="changeContent($event.target.value)"
    @focusout="setEditOn(false)"
  />
</template>

<script lang="ts">
import { computed, ref } from "vue";
import MarkdownIt from "markdown-it";
import { useStore } from "@/store";
const mdKatex = require('markdown-it-katex'); // eslint-disable-line
const mdImsize = require('markdown-it-imsize'); // eslint-disable-line
const mdContainer = require('markdown-it-container'); // eslint-disable-line
const mdVideo = require('markdown-it-block-embed'); // eslint-disable-line
//import MarkdownItCollapsible from "markdown-it-collapsible";
import { tooltip } from "@/components/node_content/mdTooltipPlugin"
import Token from "markdown-it/lib/token";
import {escapeHtml} from "markdown-it/lib/common/utils";

const md = new MarkdownIt();
md.use(mdKatex, { output: "html" })
  .use(mdImsize)
  .use(tooltip) 
  .use(mdVideo, {
    containerClassName: "video-embed",
    youtube: {
      width: 370,
      height: 209
    }
  })
  .use(mdContainer, "warning", {
    validate: function(params: any) {
      return params.trim().match(/^warning$/);
    },
    render: function(tokens: any, idx: any) {
      const m = tokens[idx].info.trim().match(/^warning(.*)$/);
      if (tokens[idx].nesting === 1) {
        // opening tag
        return (
          '<div style="background-color: #c6f68d; padding-left:0.5rem;">' +
          md.utils.escapeHtml(m[1]) +
          "\n"
        );
      } else {
        // closing tag
        return "</div>\n";
      }
    }
  });
// add target=_blank to links
const defaultLinkRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // Add a new `target` attribute, or replace the value of the existing one.
  tokens[idx].attrSet('target', '_blank');

  // Pass the token to the default renderer.
  return defaultLinkRender(tokens, idx, options, env, self);
};

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
      required: false
    },
    height: {
      type: String,
      required: false
    },
    allowEdit: {
      type: Boolean,
      required: true
    },
    editClickBegin: {
      type: Function,
      required: false
    },
    editClickFinish: {
      type: Function,
      required: false
    }
  },
  setup(props: any, ctx: any) {
    const store = useStore();

    function markSearchWords(tokens: Token[], idx: number) {
      if (store.state.searchResult.searchString.length === 0) {
        return escapeHtml(tokens[idx].content)
      }
      // traverse all children token with type === text
      // and mark search words
      const searchWords = store.state.searchResult.searchString.toLowerCase().
      split(/\s+/).
      filter(w => w.length>0);

      const newWords = [];
      const token = tokens[idx];
      if (token.type === 'text' && token.content.length > 0) {
        const words = token.content.split(/\s+/);
        for (const word of words) {
          if (word.length === 0) {
            continue;
          }
          let wordMarked = false;
          for (const searchWord of searchWords) {
            if (word.toLowerCase().startsWith(searchWord)) {
              newWords.push(`<span style="background-color: springgreen;">${escapeHtml(word)}</span>`);
              wordMarked = true;
              break;
            }
          }
          if (!wordMarked) {
            newWords.push(escapeHtml(word));
          }
        }
      }

      return newWords.join(' ');
    }

    md.renderer.rules.text = markSearchWords
    const renderedContent = computed(() => {
      return md.render(props.content);
    });
    const editOn = ref(false);

    const txtarea = ref<HTMLTextAreaElement | null>(null);

    const contentHeight = computed(()=>{
      if (props.height) {
        return props.height
      }

      if (props.content.length) {
        return ''
      }

      return '3rem';
    })

    return {
      contentHeight,
      isAuthorized: computed(
        () =>
          props.allowEdit &&
          store.state.user &&
          store.state.user.user &&
          !store.state.user.user.isAnonymous
      ),
      editOn,
      txtarea,
      setEditOn: (val: boolean) => {
        editOn.value = val;
        if (val && txtarea.value) {
          props.editClickBegin();
          txtarea.value.style.display = "block";
          txtarea.value.focus();
          txtarea.value.style.height = txtarea.value.scrollHeight + 3 + "px";
          props.editClickFinish();
          // txtarea.value.setSelectionRange(3, 3);
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
@import "./mdTooltip.css";
@import "../../../node_modules/katex/dist/katex.min.css";
.renderedContent {
  padding: 8px 9px;
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
  margin-top: 20px;
  overflow-y: scroll;
  height: 100%;
  font-family: Roboto, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 20px;
  padding: 8px 10px;
}
</style>
