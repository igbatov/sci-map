<template>
  <text
      :id="id"
      :font-family="fontFamily"
      :font-size="fontSize"
      :font-weight="fontWeight"
      :fill="color"
  >
    <tspan
        v-for="(line, i) of lines"
        :key="i"
        :x="x"
        :y="y + i*lineHeight"
        alignment-baseline="hanging"
    >
      {{line}}
    </tspan>
  </text>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {splitLines} from "@/components/SVGTextBox";

export default defineComponent({
  name: "SVGTextBox",
  props: {
    id: {
      type: String,
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
      type: String,
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
    return {
      lines: splitLines(props.text, props.maxCharPerLine)
    }
  }
})
</script>
