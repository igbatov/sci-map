<template>
  <InputText
      placeholder="some text to search"
      @update:modelValue="doSearch($event)"
  />
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import { search } from "@/tools/textsearch";
import { mutations as searchMutations } from "@/store/search_result";
import { useStore } from "@/store";

export default {
  name: "TextSearch",
  components: {
    InputText,
  },

  setup() {
    const store = useStore();
    return {
      doSearch: async (value: string) => {
        const res = await search(value)
        store.commit(`searchResult/${searchMutations.SET_NODE_IDS}`, res);
        return res
      },
    }
  },
}
</script>

<style module>

</style>
