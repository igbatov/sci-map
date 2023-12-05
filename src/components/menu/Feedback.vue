<template>
  <Button iconPos="right" @click="send">
    <img
      alt="logo"
      src="../../assets/images/discord-icon-svgrepo-com.svg"
      style="width: 20px"
    />
    <span class="p-ml-2 p-text-bold">chat</span>
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
        window.open("https://discord.com/channels/1171118046543347782/1171118047105396749", "_blank");
      }
    };
  }
};
</script>
