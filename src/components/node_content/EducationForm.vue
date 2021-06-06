<template>
  <div class="p-grid">
    <div v-if="!newFormShow" class="p-col-12">
      <EducationFormAutocomplete
        :resources="resources"
        @item-select="autoCompleteSelect($event)"
        @update-value="autoCompleteUpdate($event)"
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
          ></InputText>
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
import EducationFormAutocomplete from "./EducationFormAutocomplete.vue";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import { computed, PropType, ref, watch } from "vue";
import { actions, useStore } from "@/store";
import {
  EducationType,
  Resource,
  Resources,
  ResourceType
} from "@/store/resources";
import { printError } from "@/tools/utils";
import { ResourceRating } from "@/store/node_content";
import {BRAND_NEW_RESOURCE} from "@/components/node_content/EducationFormAutocomplete.vue";

export default {
  name: "EducationForm",
  components: {
    InputText,
    EducationFormAutocomplete,
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
    const selectedType = ref<EducationType>("book");
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
        name: "peer-reviewed article",
        fields: [
          { title: "title" },
          { author: "author(s)" },
          { findPhrase: "find phrase" },
          { url: "URL" },
          { doi: "DOI" }
        ]
      },
      post: {
        name: "post",
        fields: [
          { title: "title" },
          { author: "author(s)" },
          { findPhrase: "find phrase" },
          { url: "URL" }
        ]
      },
      onlineCourse: {
        name: "online course",
        fields: [{ title: "title" }, { url: "URL" }]
      },
      offlineCourse: {
        name: "offline course",
        fields: [{ title: "title" }, { url: "URL" }]
      }
    };
    const typeKeys = Object.keys(types) as EducationType[];
    const typeOptions = typeKeys.map(key => ({
      name: types[key].name,
      code: key
    }));
    return {
      newFormShow,
      selectedType,
      autoCompleteUpdate: (e: string) => {
        console.log("autoCompleteUpdate", e);
      },
      autoCompleteSelect: async (e: Resource) => {
        if (e.id == BRAND_NEW_RESOURCE) {
          newFormShow.value = true;
          return;
        }

        await store.dispatch(`${actions.addNodeResourceRating}`, {
          rr: {
            resourceID: e.id,
            comment: "",
            rating: 0
          } as ResourceRating,
          nodeID: selectedNode.value.id
        });
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
        await store.dispatch(`${actions.addNodeResourceRating}`, {
          rr: {
            resourceID: resource.id,
            comment: "",
            rating: 0
          },
          nodeID: selectedNode.value.id
        });
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
