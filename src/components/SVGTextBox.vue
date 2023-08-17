<template>
  <text
    :id="id"
    :font-family="fontFamily"
    :font-size="fontSize"
    :font-weight="fontWeight"
    :fill="color"
    class="text"
  >
    <tspan
      v-for="(line, i) of lines"
      :key="i"
      :x="x"
      :y="y > 0 ? y + i * lineHeight : 0"
      alignment-baseline="hanging"
    >
      {{ line }}
    </tspan>
  </text>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { splitLines } from "@/components/SVGTextBox";

export default defineComponent({
  name: "SVGTextBox",
  props: {
    id: {
      type: String,
      required: true
    },
    useLineBreak: {
      type: Boolean,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    lineHeight: {
      type: Number,
      required: true
    },
    maxCharPerLine: {
      type: Number,
      required: true
    },
    fontFamily: {
      type: String,
      required: true
    },
    fontSize: {
      type: Number,
      required: true
    },
    fontWeight: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },
  setup(props) {
    let lines = []
    if (props.useLineBreak) {
      lines = splitLines(props.text, props.maxCharPerLine)
    } else {
      lines = [props.text]
    }
    return {
      lines,
    };
  }
});
</script>


<style scoped>
.text {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
