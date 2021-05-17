<template>
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useStore, actions } from "@/store";
export default defineComponent({
  setup() {
    const store = useStore();
    store.dispatch(actions.init);
  }
});
</script>
