<template>
  <AddResourceForm :resources="resources" />
  <div class="p-grid" v-for="rr of ratings" :key="rr.resourceID">
    <div
      class="p-col-12"
      :class="{ 'user-rated': isRatedByCurrentUser(rr.ratedCount) }"
      v-if="!rr.spam"
    >
      <div class="p-grid">
        <div class="p-col-8">
          {{ resources[rr.resourceID].title }}
        </div>
        <div class="p-col-3">
          <Dropdown
            :modelValue="rr.rating"
            :options="ratingList"
            @change="changeRating(rr.resourceID, $event)"
            @mousedown="checkAuthorized"
            placeholder=""
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div class="p-col-1">
          <Button
            v-if="isRatedByCurrentUser(rr.ratedCount)"
            @mousedown="checkAuthorized"
            @click="remove(rr.resourceID)"
            icon="pi pi-ban"
            class="p-button-rounded p-button-help p-button-outlined"
            v-tooltip.right="'Remove rating'"
          />
          <Button
            v-else
            @mousedown="checkAuthorized"
            @click="reportSpam(rr.resourceID)"
            icon="pi pi-exclamation-circle"
            class="p-button-rounded p-button-help p-button-outlined"
            v-tooltip.right="'Mark as spam/inappropriate'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, PropType } from "vue";
import { Resource } from "@/store/resources";
import { ResourceRating } from "../../../store/node_content";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import Tooltip from "primevue/tooltip";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { actions, useStore } from "@/store";
import AddResourceForm from "./AddResourceForm.vue";
import { orderBy } from "lodash";

export default {
  name: "Resources",
  props: {
    nodeId: String,
    resources: Object as PropType<Record<string, Resource>>,
    resourcesRating: Object as PropType<ResourceRating[]>
  },
  components: {
    Dropdown,
    Button,
    AddResourceForm
  },
  directives: {
    tooltip: Tooltip
  },
  setup(props: {
    nodeId: string;
    resources: Record<string, Resource>;
    resourcesRating: ResourceRating[];
  }) {
    const store = useStore();
    const confirm = useConfirm();
    const toast = useToast();

    const ratings = computed(() =>
      orderBy(props.resourcesRating, ["rating", "ratedCount"], ["desc", "desc"])
    );
    return {
      ratings,
      isRatedByCurrentUser: (ratedCount: number) => {
        return ratedCount == -1;
      },
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      changeRating: (
        resourceID: string,
        e: { originalEvent: Event; value: string }
      ) => {
        const rr = {
          nodeID: props.nodeId,
          resourceID: resourceID,
          rating: e.value
        };
        store.dispatch(`${actions.rateNodeResource}`, rr);
      },
      remove: (resourceID: string) => {
        store.dispatch(`${actions.removeNodeResource}`, {
          nodeID: props.nodeId,
          resourceID: resourceID
        });
      },
      reportSpam: (resourceID: string) => {
        confirm.require({
          message:
            "This will set resource as spam and remove it from your list. This cannot be undone. Are you sure?",
          header: "Confirmation",
          icon: "pi pi-exclamation-triangle",
          accept: async () => {
            await store.dispatch(`${actions.reportSpam}`, {
              nodeID: props.nodeId,
              type: "resourceRatings",
              id: resourceID,
              spam: 1
            });
            const title = props.resources[resourceID].title;
            toast.add({
              severity: "info",
              summary: "Confirmed",
              detail: `"${title}" was removed as spam`,
              life: 3000
            });
          },
          reject: () => {
            return;
          }
        });
      },
      ratingList: [
        { label: "Don't like it", value: -1 },
        { label: "Not read yet", value: 0 },
        { label: "Average", value: 1 },
        { label: "I like it", value: 2 },
        { label: "Strongly impressed", value: 3 }
      ]
    };
  }
};
</script>

<style scoped>
.user-rated {
  background-color: #c6f68d;
}
</style>
