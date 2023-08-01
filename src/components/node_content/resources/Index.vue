<template>
  <AddResourceForm :resources="resources" />
  <div
      v-for="resourceId of resourceIds"
      class="p-grid"
      :key="resourceId"
  >
    <div class="p-col-12">
      <div class="p-grid">
        <div class="p-col-11">
          {{ resources[resourceId].title }}
        </div>
        <div class="p-col-1">
          <Button
              @click="remove(resourceId)"
              icon="pi pi-ban"
              class="p-button-rounded p-button-help p-button-outlined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType } from "vue";
import { Resource } from "@/store/resources";
import Tooltip from "primevue/tooltip";
import { useConfirm } from "primevue/useconfirm";
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import AddResourceForm from "./AddResourceForm.vue";
import Button from "primevue/button";

export default {
  name: "Resources",
  props: {
    nodeId: String,
    resources: Object as PropType<Record<string, Resource>>,
    resourceIds: Object as PropType<Array<string>>,
  },
  components: {
    Button,
    AddResourceForm
  },
  directives: {
    tooltip: Tooltip
  },
  setup(props: {
    nodeId: string;
    resources: Record<string, Resource>;
  }) {
    const store = useStore();
    const confirm = useConfirm();

    return {
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      remove: (resourceID: string) => {
        store.dispatch(`nodeContent/${nodeContentActions.removeNodeResource}`, {
          nodeID: props.nodeId,
          resourceID: resourceID
        });
      },
    };
  }
};
</script>

<style scoped>
.user-rated {
  background-color: #c6f68d;
}
</style>
