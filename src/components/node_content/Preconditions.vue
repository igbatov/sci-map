<template>
  <div
    v-for="precondition of preconditions"
    class="p-grid"
    :key="precondition.id"
  >
    <div class="p-col-12">
      <div class="p-grid">
        <div class="p-col-11">
          {{ precondition.title }}
        </div>
        <div class="p-col-1">
          <Button
            @click="remove(precondition.id)"
            icon="pi pi-ban"
            class="p-button-rounded p-button-help p-button-outlined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Button from "primevue/button";
import { ref, watchEffect } from "vue";
import { useStore } from "@/store";
import { actions as preconditionActions } from "@/store/precondition";
import api from "@/api/api";
import { Tree } from "@/types/graphics";

export default {
  name: "Preconditions",
  props: {
    nodeId: String
  },
  components: {
    Button
  },
  setup(props: { nodeId: string }) {
    const store = useStore();
    const preconditions = ref<Array<Tree>>([]);
    watchEffect(() => {
      preconditions.value = [];
      if (
        props.nodeId &&
        store.state.precondition.preconditions[props.nodeId]
      ) {
        for (const id of store.state.precondition.preconditions[props.nodeId]) {
          preconditions.value.push(store.state.tree.nodeRecord[id].node);
        }
      }
    });

    return {
      preconditions,
      remove: (id: string) => {
        store.dispatch(
          `precondition/${preconditionActions.RemovePrecondition}`,
          {
            nodeId: props.nodeId,
            preconditionId: id
          }
        );
        api.savePreconditions(store.state.user.user, {
          nodeId: props.nodeId,
          preconditionIds: store.state.precondition.preconditions[props.nodeId]
        });
      }
    };
  }
};
</script>
