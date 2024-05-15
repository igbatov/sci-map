<template>
  <img
      alt="add_icon"
      v-if="event.isRemoved && IsNodeInTrash(event.node.idPath)"
      src="../../assets/images/revert.svg"
      style="width: 30px; cursor: pointer;"
      @click="revertRemove(event)"
  />
<!--  In case parent node was deleted show Dialog to select new parent -->
  <Dialog
      v-model:visible="newParentDialogVisible"
      :dismissableMask="false"
      :closable="true"
      :modal="false"
      :closeOnEscape="true"
      @mousedown.stop
  >
    <template #header>
      <h3>
        Parent node of this node was deleted, please select new parent.
      </h3>
    </template>
    Set "{{
      newParentNode && newParentNode.title
          ? newParentNode.title
          : ""
    }}" as new parent node.
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

<script lang="ts">
import {defineComponent, PropType, ref, watch} from "vue";
import {ChangeLogNodeParent} from "@/store/change_log";
import {IsNodeInTrash} from "@/api/change_log";
import api from "@/api/api";
import {useStore} from "@/store";
import {Tree} from "@/types/graphics";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import {useToast} from "primevue/usetoast";

export default defineComponent({
  name: "RestoreNode",
  components: {
    Dialog,
    Button,
  },
  emits: ["restore-select-new-parent-is-on", "restore-select-new-parent-is-off"],
  props: {
    event: {
      type: Object as PropType<ChangeLogNodeParent>,
      required: true,
    },
    clickedTitleId: {
      type: String,
      required: true,
    },
  },
  setup(props, ctx) {
    // select new parent Dialog stuff
    const store = useStore();
    const toast = useToast();
    const newParentDialogVisible = ref(false);
    const newParentNode = ref(null as Tree | null);
    const nodeIdToRestore = ref("");
    watch(
        () => props.clickedTitleId,
        () => {
          if (
              newParentDialogVisible.value &&
              nodeIdToRestore.value &&
              props.clickedTitleId !== "-1" &&
              store.state.tree.nodeRecord[props.clickedTitleId]
          ) {
            newParentNode.value =
                store.state.tree.nodeRecord[props.clickedTitleId].node;
          }
        },
        { immediate: true }
    );

    const restoreNodeWithChildren = async (nodeID: string, parentID: string) => {
      // do main actions on backend (see functions/cmd_restore.js)
      return await api.update({ [`cmd/restore`]: {
          nodeID,
          parentID,
        }
      });
    }
    return {
      newParentDialogVisible,
      newParentNode,
      cancelAdd: () => {
        newParentDialogVisible.value = false;
        nodeIdToRestore.value = "";
        newParentNode.value = null;
        ctx.emit("restore-select-new-parent-is-off");
      },
      add: async () => {
        toast.add({
          severity: "info",
          summary: "Please, wait",
          detail: "Restore can take up to 15 seconds",
          life: 15000
        });
        await restoreNodeWithChildren(nodeIdToRestore.value, newParentNode.value!.id)
        ctx.emit("restore-select-new-parent-is-off");
        newParentDialogVisible.value = false;
        nodeIdToRestore.value = "";
        newParentNode.value = null;
      },
      IsNodeInTrash,
      revertRemove: async (event: ChangeLogNodeParent) => {
        if (!event.isRemoved) {
          return
        }

        if (event.parentNodeBefore && !IsNodeInTrash(event.parentNodeBefore.idPath)) {
          if (IsNodeInTrash(event.node.idPath)) {
            toast.add({
              severity: "info",
              summary: "Please, wait",
              detail: "Restore can take up to 15 seconds",
              life: 15000
            });
            await restoreNodeWithChildren(event.node.id, event.parentNodeBefore.id)
          }
        } else {
          // parent node is in trash - let user choose new parent
          ctx.emit('restore-select-new-parent-is-on');
          newParentDialogVisible.value = true;
          nodeIdToRestore.value = event.node.id;
        }
      },
    }
  }
})
</script>
