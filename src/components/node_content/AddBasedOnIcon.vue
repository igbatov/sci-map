<template>
  <div style="cursor: pointer;" @mouseenter="mouseOver=true" @mouseleave="mouseOver=false">
    <div v-if="mouseOver" class="custom">
      <img style="height: 35px" alt="pin-off" src="../../assets/images/add-on.svg"/>
    </div>
    <div v-else class="custom">
      <img style="height: 35px" alt="pin-on" src="../../assets/images/add-off.svg"/>
    </div>
  </div>
</template>

<script>
import {ref} from "vue";

export default {
  name: "AddBasedOnIcon",
  setup() {
    const mouseOver = ref(false)
    return {
      mouseOver,
    }
  }
}
</script>

<style scoped>
.custom {
  margin-left: 15px;
}
</style>
