<template>
  <Button iconPos="right" @click="send">
    <img
      alt="logo"
      src="../../assets/images/telegram.svg"
      style="width: 20px"
    />
    <span class="p-ml-2 p-text-bold">give us feedback!</span>
  </Button>
</template>

<script>
import Button from "primevue/button";

export default {
  name: "Feedback",
  components: {
    Button
  },
  setup() {
    return {
      send: () => {
        window.open("https://t.me/scimap", "_blank");
      }
    };
  }
};
</script>
