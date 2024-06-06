<template>
  <Button @click="showChangeLog">Change log</Button>
</template>

<script lang="ts">
import Button from "primevue/button";
import { defineComponent } from "vue";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "ChangeLog",
  props: {
    nodeId: {
      type: String,
      required: true
    }
  },
  components: {
    Button
  },
  setup(props) {
    const router = useRouter();
    const query = {
      logFilterActionType: "content"
    } as Record<string, string>;
    return {
      showChangeLog: () => {
        query["logFilterNodeID"] = props.nodeId.toString();
        router.push({
          name: "node",
          params: { id: props.nodeId },
          query
        });
      }
    };
  }
});
</script>
