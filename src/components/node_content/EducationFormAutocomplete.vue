<template>
  <AutoComplete
    placeholder="start typing to find resource..."
    :suggestions="filteredResources"
    v-model="modelValue"
    @complete="searchResource($event)"
    @item-select="selectResource($event)"
    field="title"
  />
</template>

<script lang="ts">
import AutoComplete from "primevue/autocomplete";
import { computed, PropType, ref, SetupContext } from "vue";
import { Resource, Resources, ResourceType } from "@/store/resources";

export default {
  name: "EducationFormAutocomplete",
  emits: ["item-select", "update-value"],
  components: {
    AutoComplete
  },
  props: {
    resources: Object as PropType<Resources>
  },
  setup(props: { resources: Resources }, ctx: SetupContext) {
    const filteredResources = ref<Resource[]>([]);
    const modelValue = ref<string>("");
    return {
      modelValue,
      filteredResources,
      selectResource(e: { originalEvent: Event; value: any }) {
        ctx.emit("item-select", e.value);
      },
      searchResource(e: { originalEvent: Event; query: string }) {
        ctx.emit("update-value", e.query);
        filteredResources.value = [];
        for (const id in props.resources) {
          if (props.resources[id].title.includes(e.query)) {
            filteredResources.value.push(props.resources[id]);
          }
        }
      }
    };
  }
};
</script>
