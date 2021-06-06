<template>
  <div class="p-grid">

  </div>
</template>

<script lang="ts">
import {useStore} from "@/store";

export default {
  name: "Vacancies",
  props: {
    nodeId: String,
  },
  setup() {
    const store = useStore();
    return {};
  }
}
</script>
