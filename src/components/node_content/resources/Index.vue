<template>
  <AddResourceForm :resources="resources" />
  <div class="p-grid">
    <div class="p-col-12">
      <div class="p-grid" v-for="rr of resourcesRating" :key="rr.resourceID">
        <div class="p-col-8">
          {{ resources[rr.resourceID].title }}
        </div>
        <div class="p-col-3">
          <Dropdown
            :modelValue="rr.rating"
            :options="ratingList"
            @change="changeRating(rr.resourceID, $event)"
            placeholder=""
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div class="p-col-1">
          <Button
            @click="remove(rr.resourceID)"
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
import { ResourceRating } from "../../../store/node_content";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import { actions, useStore } from "@/store";
import AddResourceForm from "./AddResourceForm.vue";

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
    AddResourceForm,
  },
  setup(props: {
    nodeId: string;
    resources: Record<string, Resource>;
    resourcesRating: ResourceRating[];
  }) {
    const store = useStore();

    return {
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
