<template>
  <div class="p-grid">
    <div class="p-col-2 p-mt-2">
      <span style="font-weight: bold; font-size: larger">Education</span>
    </div>
    <div v-if="!newFormShow" class="p-col-7">
      <AutoComplete
        placeholder="start typing to find resource..."
        v-model="selectedCountry"
        :suggestions="filteredCountriesBasic"
        @complete="searchCountry($event)"
        field="education"
      />
    </div>
    <div v-if="!newFormShow" class="p-col-3">
      <Button label="or add new" class="p-button-rounded" @click="addNew" />
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
          <InputText :id="Object.keys(field)[0]" type="text"></InputText>
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

<script>
import InputText from "primevue/inputtext";
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import { ref } from "vue";

export default {
  name: "Education",
  components: {
    InputText,
    AutoComplete,
    Button,
    SelectButton
  },
  setup() {
    const newFormShow = ref(false);
    const selectedType = ref("book");
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
    return {
      newFormShow,
      selectedType,
      save: () => {
        console.log(selectedType.value);
      },
      cancel: () => {
        newFormShow.value = false;
      },
      addNew: () => {
        newFormShow.value = true;
      },
      typeOptions: Object.keys(types).map(key => ({
        name: types[key].name,
        code: key
      })),
      types
    };
  }
};
</script>
