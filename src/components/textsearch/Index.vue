<template>
  <div :class="$style.wrapper">
    <div class="p-col-12">
              <TextArea
                  rows="1"
                  :autoResize="false"
                  placeholder="some text to search"
                  @update:modelValue="doSearch($event)"
              />
    </div>
  </div>
</template>

<script lang="ts">
import TextArea from "primevue/textarea";
import { search } from "@/tools/textsearch";

export default {
  name: "TextSearch",
  components: {
    TextArea,
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
.wrapper {
  position: fixed;
  display: flex;
  top: 0;
  left: 0;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
