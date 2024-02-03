<template>
  <div
    style="cursor: pointer;"
    @mouseenter="mouseOver = true"
    @mouseleave="mouseOver = false"
  >
    <div v-if="mouseOver" class="custom">
      <img
        style="height: 35px"
        alt="pin-off"
        src="../../assets/images/remove-on.svg"
      />
    </div>
    <div v-else class="custom">
      <img
        style="height: 35px"
        alt="pin-on"
        src="../../assets/images/remove-off.svg"
      />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";

export default {
  name: "RemoveIcon",
  setup() {
    const mouseOver = ref(false);
    return {
      mouseOver
    };
  }
};
</script>

<style scoped>
.custom {
  margin-left: 15px;
}
</style>
