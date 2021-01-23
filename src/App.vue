<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore } from "@/store";
import { actions } from "@/store/user";
export default defineComponent({
  setup() {
    const store = useStore();
    store.dispatch(`user/${actions.init}`);
  }
});
</script>
