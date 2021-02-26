<template>
  <button @click="toggleDialog" :disabled="!selectedNodeTitle">-</button>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
  >
    <template #header>
      <h3>
        {{ `Remove ${selectedNodeTitle} and all its descendants?` }}
      </h3>
    </template>

    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        class="p-button-text"
        @click="cancel"
      />
      <Button label="Yes" icon="pi pi-check" @click="remove" />
    </template>
  </Dialog>
</template>

<script>
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { mutations as treeMutations } from "@/store/tree";

export default {
  name: "AddNode",
  components: {
    Dialog,
    Button
  },
  setup() {
    const store = useStore();
    const addDialogVisible = ref(false);
    const selectedNode = computed(() => store.getters["tree/selectedNode"]);

    return {
      selectedNodeTitle: computed(() =>
        selectedNode.value ? selectedNode.value.title : ""
      ),
      toggleDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      remove: () => {
        addDialogVisible.value = false;
        store.commit(
          `tree/${treeMutations.REMOVE_NODE}`,
          selectedNode.value.id
        );
      },
      cancel: () => {
        addDialogVisible.value = false;
      },
      addDialogVisible
    };
  }
};
</script>