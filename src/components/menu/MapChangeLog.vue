<template>
  <ChangeLogComplain
    :show="complainModalVisible"
    :complainChangeLink="complainChangeLink"
    @hide="complainModalVisible = false"
  />
  <button @click="toggleAddDialog">Log</button>
  <Dialog
    v-model:visible="addDialogVisible"
    :dismissableMask="true"
    :closable="true"
    :modal="true"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
      <h3>
        Map change log
      </h3>
    </template>
    <Card v-for="(event, i) of changes" :key="i" class="mt-3">
      <template #title>
        {{ new Date(event.timestamp).toLocaleDateString() }}
        {{ new Date(event.timestamp).toLocaleTimeString() }}
      </template>
      <template #subtitle>
        {{ event.userDisplayName }} /
        <a href="#" @click="showComplain(event.changeLogID)">Complain</a>
      </template>
      <template #content>
        <div v-html="getActionDescription(event)"></div>
      </template>
    </Card>
  </Dialog>
</template>

<script lang="ts">
import Dialog from "primevue/dialog";
import { reactive, ref } from "vue";
import { ActionType, ChangeLogNodeParent } from "@/store/change_log";
import { GetNodeUrl, subscribeChangeLogEnriched } from "@/api/change_log";
import Card from "primevue/card";
import ChangeLogComplain from "@/components/node_content/ChangeLogComplain.vue";

export default {
  name: "MapChangeLog",
  components: {
    ChangeLogComplain,
    Card,
    Dialog
  },
  setup() {
    const complainChangeLink = ref("");
    const complainModalVisible = ref(false);
    const addDialogVisible = ref(false);
    const changes = reactive([]) as Array<ChangeLogNodeParent>;
    subscribeChangeLogEnriched([ActionType.ParentID], [], changeLogs => {
      changes.splice(
        0,
        changes.length,
        ...(changeLogs as Array<ChangeLogNodeParent>)
      );
    });

    return {
      complainChangeLink,
      complainModalVisible,
      showComplain: (id: string) => {
        complainModalVisible.value = true;
        complainChangeLink.value = "https://scimap.org/change/" + id;
      },
      toggleAddDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      addDialogVisible,
      changes,
      getActionDescription: (event: ChangeLogNodeParent): string => {
        if (event.isAdded) {
          return `node ${GetNodeUrl(
            event.node.idPath,
            event.node.id,
            event.node.name
          )} was added to ${GetNodeUrl(
            event.parentNodeAfter.idPath,
            event.parentNodeAfter.id,
            event.parentNodeAfter.name
          )}`;
        }
        if (event.isRemoved) {
          return `node ${GetNodeUrl(
            event.node.idPath,
            event.node.id,
            event.node.name
          )} was removed from ${GetNodeUrl(
            event.parentNodeBefore.idPath,
            event.parentNodeBefore.id,
            event.parentNodeBefore.name
          )}`;
        }

        return `node ${GetNodeUrl(
          event.node.idPath,
          event.node.id,
          event.node.name
        )} was moved from ${GetNodeUrl(
          event.parentNodeBefore.idPath,
          event.parentNodeBefore.id,
          event.parentNodeBefore.name
        )} to ${GetNodeUrl(
          event.parentNodeAfter.idPath,
          event.parentNodeAfter.id,
          event.parentNodeAfter.name
        )}`;
      }
    };
  }
};
</script>
