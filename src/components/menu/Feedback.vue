<template>
  <MenuButton @click="send">
    <img alt="icon" src="../../assets/images/chat.svg" style="width: 20px" />
    <span class="p-ml-2">chat</span>
  </MenuButton>
</template>

<script>
import MenuButton from "@/components/menu/MenuButton.vue";

export default {
  name: "Feedback",
  components: {
    MenuButton
  },
  setup() {
    return {
      send: () => {
        window.open(
          "https://discord.com/channels/1171118046543347782/1171118047105396749",
          "_blank"
        );
      }
    };
  }
};
</script>
