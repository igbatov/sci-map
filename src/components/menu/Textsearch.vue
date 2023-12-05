<template>
  <InputText
      placeholder="some text to search"
      @update:modelValue="doSearch($event)"
  />
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import { search } from "@/tools/textsearch";

export default {
  name: "TextSearch",
  components: {
    InputText,
  },
  setup() {
    return {
      doSearch: async (value: string) => {
        const res = await search(value)
        console.log(res)
        return res
      },
    }
  },
}
</script>

<style module>

</style>
