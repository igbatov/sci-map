<template>
  <AddBasedOnIcon @click="showAddBanner" />
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
import { actions, useStore } from "@/store";
import { computed, ref, watch } from "vue";
import api from "@/api/api";
import AddBasedOnIcon from "@/components/node_content/AddBasedOnIcon.vue";
import { useConfirm } from "primevue/useconfirm";

export default {
  name: "AddBasedOnButton",
  components: {
    Dialog,
    Button,
    AddBasedOnIcon
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
    const confirm = useConfirm();
    const addBannerVisible = ref(false);
    const targetNode = ref({}); // node where precondition must be added
    const preconditionNode = ref({}); // node where precondition must be added
    const selectedNode = computed(() => store.getters["tree/selectedNode"]); // current selected node

    watch(
      () => props.clickedTitleId,
      () => {
        if (
          addBannerVisible.value &&
          props.clickedTitleId !== "-1" &&
          store.state.tree.nodeRecord[props.clickedTitleId]
        ) {
          preconditionNode.value =
            store.state.tree.nodeRecord[props.clickedTitleId].node;
        }
      },
      { immediate: true }
    );

    return {
      showAddBanner: async () => {
        if (
          !(
            store.state.user &&
            store.state.user.user &&
            !store.state.user.user.isAnonymous
          )
        ) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {
            confirm,
            message: "Please authorize to added node prerequisites"
          });
          return;
        }
        ctx.emit("select-precondition-is-on");
        targetNode.value = store.getters["tree/selectedNode"];
        addBannerVisible.value = !addBannerVisible.value;
      },
      add: () => {
        let preconditionsIDs = [];
        if (store.state.precondition.preconditions[targetNode.value.id]) {
          preconditionsIDs =
            store.state.precondition.preconditions[targetNode.value.id];
        }
        preconditionsIDs.push(preconditionNode.value.id);

        api.savePreconditions(store.state.user.user, {
          nodeId: targetNode.value.id,
          preconditionIds: preconditionsIDs
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
