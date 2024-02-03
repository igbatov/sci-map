<template>
  <Button
      size="small"
      rounded
      @mouseenter="mouseover=true"
      @mouseleave="mouseover=false"
      :style="(mouseover ? `background-color: rgba(0, 0, 0, 0.1); ` : (bgColor ? `background-color: ${bgColor};` : `background-color: white;`)) + `color: black; border-color:#3B6BF9;`"
  >
    <slot></slot>
  </Button>
</template>

<script>
import Button from "primevue/button";
import {ref, defineComponent} from "vue";

export default defineComponent({
  name: "MenuButton",
  components: {
    Button
  },
  props: {
    bgColor: String,
  },
  setup() {
    const mouseover = ref(false)
    return {
      mouseover,
    };
  }
});
</script>
