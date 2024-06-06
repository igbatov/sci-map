<template>
  <div
    style="cursor: pointer;"
    @mouseenter="mouseOver = true"
    @mouseleave="mouseOver = false"
  >
    <div v-if="isOn || mouseOver" class="subscribe">
      <img
        style="height: 35px"
        alt="img"
        src="../../assets/images/eye-on.svg"
      />
    </div>
    <div v-else class="subscribe">
      <img
        style="height: 35px"
        alt="img"
        src="../../assets/images/eye-off.svg"
      />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "SubscribeIcon",
  props: {
    isOn: Boolean
  },
  setup() {
    const mouseOver = ref(false);
    return {
      mouseOver
    };
  }
};
</script>

<style scoped>
.subscribe {
  margin-top: 15px;
}
</style>
