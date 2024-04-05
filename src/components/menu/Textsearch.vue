<template>
  <span class="p-input-icon-right" style="width: 100%">
    <i class="pi pi-times" style="right: 1.2rem; cursor: pointer;" @click="clearBox" />
    <InputText
      :class="$style['searchBox']"
      placeholder="Search SciMap"
      v-model="value"
      @update:modelValue="doSearch($event)"
    />
  </span>
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import { search } from "@/tools/textsearch";
import { mutations as searchMutations } from "@/store/search_result";
import { useStore } from "@/store";
import { ref } from "vue";
import api from "@/api/api";
import { debounce } from "lodash";

export default {
  name: "TextSearch",
  components: {
    InputText
  },

  setup() {
    const value = ref("");
    const store = useStore();
    const debouncedLog = debounce(api.setUserLastSearch, 2000)
    const doSearch = async(value: string) => {
      const res = await search(value);
      store.commit(`searchResult/${searchMutations.SET_NODE_IDS}`, res);
      if (value.length > 0) {
        debouncedLog(store.state.user.user!.uid, value);
      }
      return res;
    }

    return {
      doSearch,
      value,
      clearBox: async () => {
        value.value = "";
        await doSearch('')
      }
    };
  }
};
</script>

<style module>
.searchBox {
  border-radius: 2rem !important;
  padding: 0.8rem 2rem !important;
  width: 100%;
}
</style>
