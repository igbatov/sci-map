<template>
  <div style="cursor: pointer;" @mouseenter="mouseOver=true" @mouseleave="mouseOver=false">
    <div v-if="isPinned || mouseOver" class="pin">
      <img style="height: 35px" alt="pin-off" src="../../assets/images/pin-on.svg"/>
    </div>
    <div v-else class="pin">
      <img style="height: 35px" alt="pin-on" src="../../assets/images/pin-off.svg"/>
    </div>
  </div>
</template>

<script>
import {useStore} from "@/store";
import {computed, ref} from "vue";

export default {
  name: "PinIcon",
  setup() {
    const store = useStore();
    const mouseOver = ref(false)
    return {
      isPinned: computed(
          () =>
              store.state.pin.pins[store.state.tree.selectedNodeId] !== undefined
      ),
      mouseOver,
    }
  }
}
</script>

<style scoped>
.pin {
  margin-top: 15px;
  margin-left: 15px;
}
</style>
