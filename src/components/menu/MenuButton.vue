<template>
  <Button
    size="small"
    rounded
    @mouseenter="mouseover = true"
    @mouseleave="mouseover = false"
    :style="style"
  >
    <slot></slot>
  </Button>
</template>

<script>
import Button from "primevue/button";
import {ref, defineComponent, computed} from "vue";

export default defineComponent({
  name: "MenuButton",
  components: {
    Button
  },
  props: {
    bgColor: String,
    width: String
  },
  setup(props) {
    const mouseover = ref(false);
    return {
      mouseover,
      style: computed(()=> {
        let style = 'color: black; border-color:#3B6BF9;'
        let bgColor = '';
        if (mouseover.value) {
          bgColor = `background-color: #03dbfc; `
        } else {
          if (props.bgColor) {
            bgColor = `background-color: ${props.bgColor}; `
          } else {
            bgColor = `background-color: white;`
          }
        }
        style = style + bgColor;
        if (props.width) {
          style = style + `width:${props.width}`;
        }
        return style;
      })
    };
  }
});
</script>
