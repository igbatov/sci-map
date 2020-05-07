<template>
  <div v-if="GetCurrentTreeItemStack.length" class="breadcrumbs">
    {{ text }}
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { GetNode } from "../store";

export default {
  name: "BreadCrumbs",
  computed: {
    ...mapGetters("level", ["GetCurrentTreeItemStack"]),
    text() {
      return this.GetCurrentTreeItemStack.map(
        id => this.$store.getters[GetNode](id).title
      ).join(" > ");
    }
  }
};
</script>

<style scoped>
.breadcrumbs {
  position: fixed;
  bottom: 0;
  left: 0;
  padding: 10px;
  background: white;
  border: 1px solid;
}
</style>
