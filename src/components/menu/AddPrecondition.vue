<template>
  <button @click="showAddBanner">Add Premise</button>
  <Dialog
    v-model:visible="addBannerVisible"
    :dismissableMask="false"
    :closable="true"
    :modal="false"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
      <h3>
        Set "{{
          preconditionNode.title
            ? preconditionNode.title
            : selectedNode
            ? selectedNode.title
            : ""
        }}" as precondition for "{{ targetNode ? targetNode.title : "" }}"
      </h3>
    </template>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        @click="cancelAdd"
      />
      <Button label="Done" icon="pi pi-check" @click="add" />
    </template>
  </Dialog>
</template>

<script>
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { useStore } from "@/store";
import { computed, ref, watch } from "vue";
import { actions as preconditionActions } from "@/store/precondition";
import api from "@/api/api";
import { Tree } from "@/types/graphics";

export default {
  name: "AddPrecondition",
  components: {
    Dialog,
    Button
  },
  emits: ["select-precondition-is-on", "select-precondition-is-off"],
  props: {
    clickedTitleId: {
      type: String,
      required: true
    }
  },
  setup(props, ctx) {
    const store = useStore();
    const addBannerVisible = ref(false);
    const targetNode = ref({}); // node where precondition must be added
    const preconditionNode = ref({}); // node where precondition must be added
    const selectedNode = computed(() => store.getters["tree/selectedNode"]); // current selected node

    watch(
      () => props.clickedTitleId,
      () => {
        if (
          props.clickedTitleId > 0 &&
          store.state.tree.nodeRecord[props.clickedTitleId]
        ) {
          preconditionNode.value =
            store.state.tree.nodeRecord[props.clickedTitleId].node;
        }
      },
      { immediate: true }
    );

    return {
      showAddBanner: () => {
        ctx.emit("select-precondition-is-on");
        targetNode.value = store.getters["tree/selectedNode"];
        addBannerVisible.value = !addBannerVisible.value;
      },
      add: () => {
        store.dispatch(`precondition/${preconditionActions.AddPrecondition}`, {
          nodeId: targetNode.value.id,
          preconditionId: preconditionNode.value.id
        });
        api.savePreconditions(store.state.user.user, {
          nodeId: targetNode.value.id,
          preconditionIds:
            store.state.precondition.preconditions[targetNode.value.id]
        });
        ctx.emit("select-precondition-is-off");
        addBannerVisible.value = false;
        preconditionNode.value = {};
      },
      cancelAdd: () => {
        addBannerVisible.value = false;
        preconditionNode.value = {};
        ctx.emit("select-precondition-is-off");
      },
      addBannerVisible,
      targetNode,
      preconditionNode,
      selectedNode
    };
  }
};
</script>
