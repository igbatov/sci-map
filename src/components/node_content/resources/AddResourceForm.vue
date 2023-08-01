<template>
  <div class="p-grid">
    <div v-if="!newFormShow" class="p-col-12">
      <AddResourceFormAutocomplete
        :resources="resources"
        @item-select="autoCompleteSelect($event)"
        v-on:keydown="checkAuthorized"
      />
    </div>
  </div>
  <div v-if="newFormShow" class="p-grid">
    <div class="p-col-12">
      <div class="p-grid">
        <div class="p-col-12">
          <SelectButton
            v-model="selectedType"
            :options="typeOptions"
            optionLabel="name"
            optionValue="code"
          />
        </div>
      </div>
      <div
        v-for="field of types[selectedType].fields"
        class="p-field p-grid"
        :key="Object.keys(field)[0]"
      >
        <label :for="Object.keys(field)[0]" class="p-col-3 p-mb-0">{{
          Object.values(field)[0]
        }}</label>
        <div class="p-col-9">
          <InputText
            :id="Object.keys(field)[0]"
            type="text"
            :placeholder="placeholders[Object.keys(field)[0]]"
          />
        </div>
      </div>
      <div class="p-grid">
        <div class="p-col-3">
          <Button label="Save" class="p-button-rounded" @click="save" />
        </div>
        <div class="p-col-4">
          <Button label="Cancel" class="p-button-rounded" @click="cancel" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import AddResourceFormAutocomplete from "./AddResourceFormAutocomplete.vue";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import { computed, PropType, ref } from "vue";
import { actions, useStore } from "@/store";
import { actions as nodeContentActions } from "@/store/node_content";
import { Resource, Resources, ResourceType } from "@/store/resources";
import { printError } from "@/tools/utils";
import { BRAND_NEW_RESOURCE } from "@/components/node_content/resources/AddResourceFormAutocomplete.vue";
import { useConfirm } from "primevue/useconfirm";

export default {
  name: "AddResourceForm",
  components: {
    InputText,
    AddResourceFormAutocomplete,
    Button,
    SelectButton
  },
  props: {
    resources: Object as PropType<Resources>
  },
  setup() {
    const store = useStore();
    const newFormShow = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);
    const selectedType = ref<ResourceType>("book");
    const confirm = useConfirm();
    const types = {
      book: {
        name: "book",
        fields: [
          { title: "title" },
          { author: "author(s)" },
          { chapter: "chapter(s)" },
          { findPhrase: "find phrase" },
          { url: "URL" },
          { isbn: "ISBN" },
          { doi: "DOI" }
        ]
      },
      article: {
        name: "article",
        fields: [
          { title: "title" },
          { author: "author(s)" },
          { findPhrase: "find phrase" },
          { url: "URL" },
          { doi: "DOI" }
        ]
      },
      other: {
        name: "other",
        fields: [
          { title: "title" },
          { author: "author(s)" },
          { url: "URL" },
          { findPhrase: "find phrase" },
        ]
      },
    };
    const typeKeys = Object.keys(types) as ResourceType[];
    const typeOptions = typeKeys.map(key => ({
      name: types[key].name,
      code: key
    }));
    return {
      newFormShow,
      selectedType,
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      autoCompleteSelect: async (e: Resource) => {
        if (e.id == BRAND_NEW_RESOURCE) {
          newFormShow.value = true;
          return;
        }
        await store.dispatch(
            `nodeContent/${nodeContentActions.addNodeResource}`,
            { nodeID: selectedNode.value.id, resourceID: e.id }
        );
      },
      save: async () => {
        if (!selectedNode.value || !selectedNode.value.id) {
          printError("Bad selectedNode", { selectedNode });
          return;
        }
        const values: any = {
          id: "",
          type: "book",
          author: "",
          title: "",
          findPhrase: "",
          url: "",
          doi: "",
          isbn: "",
          createdAt: 0, // = Date.UTC()
          updatedAt: 0 // = Date.UTC()
        } as Resource;
        for (const field of types[selectedType.value].fields) {
          const fieldID = Object.keys(field)[0] as keyof Resource;
          const el = document.getElementById(fieldID) as HTMLInputElement;
          const val = el.value as Resource[keyof Resource];
          values[fieldID] = val;
        }
        const resource: Resource | null = await store.dispatch(
          `${actions.addNewResource}`,
          values
        );
        if (resource == null) {
          printError("Cannot add addNewResource", values);
          return;
        }
        await store.dispatch(
            `nodeContent/${nodeContentActions.addNodeResource}`,
            { nodeID: selectedNode.value.id, resourceID: resource.id }
        );
      },
      cancel: () => {
        newFormShow.value = false;
      },
      typeOptions,
      types,
      placeholders: {
        title:
          "The Feynman Lectures on Physics, Vol. 1: Mainly Mechanics, Radiation, and Heat",
        author: "Richard Feynman, Robert B. Leighton, Matthew Sands",
        chapter: "1",
        findPhrase:
          "If, in some cataclysm, all of scientific knowledge were to be destroyed, and only one sentence passed on to the next generations of creatures, what statement would contain the most information in the fewest words?",
        url: "https://www.feynmanlectures.caltech.edu/I_01.html#Ch1-S1",
        doi: "https://doi.org/10.1119/1.1972241",
        isbn: "9780465023820"
      }
    };
  }
};
</script>
