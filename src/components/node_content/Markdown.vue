<template>
  <p
    v-show="!editOn"
    v-html="renderedContent"
    @click="setEditOn(true)"
    class="content"
  />
  <textarea
      class="p-inputtextarea p-inputtext p-component p-inputtextarea-resizable"
      style="display: none"
      id="content"
      ref="txtarea"
      :rows="rows"
      :value="content"
      @input="changeContent($event.target.value)"
      @focusout="setEditOn(false)"
  />
</template>

<script lang="ts">
import MarkdownIt from 'markdown-it';
import TextArea from "primevue/textarea";
import {computed, ref, getCurrentInstance, watchEffect, onMounted} from "vue";
const katex = require('markdown-it-katex'); // eslint-disable-line
const imsize = require('markdown-it-imsize'); // eslint-disable-line
const md = new MarkdownIt();
md.use(katex).use(imsize);

export default {
  name: "Markdown",
  emits: [
    "content-changed",
  ],
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
    const renderedContent = computed(()=>{
      return md.render(props.content);
    })
    const editOn = ref(false)

    const txtarea = ref<HTMLDivElement | null>(null)

    return {
      editOn,
      txtarea,
      setEditOn: (val: boolean) => {
        editOn.value = val
        if (val && txtarea.value) {
          txtarea.value.style.display = 'block'
          txtarea.value.focus()
        }
        if (!val && txtarea.value) {
          txtarea.value.style.display = 'none'
        }
      },
      renderedContent,
      changeContent: (value: string) => {
        ctx.emit("content-changed", value)
      },
    };
  }
}
</script>

<style scoped>
.content {
  color: rgb(32, 33, 36);
  font-family: Roboto, Arial, sans-serif;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: normal;
  line-height: 20px;
  margin-right: 4px;
  text-align: left;
  text-wrap: wrap;
}
</style>
