<template>
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
    <Card
        v-for="(event, i) of changes"
        :key="i"
        class="mt-3"
    >
      <template #title>
        {{ (new Date(event.timestamp)).toLocaleDateString() }} {{ (new Date(event.timestamp)).toLocaleTimeString() }}
      </template>
      <template #subtitle>
        {{ event.userDisplayName }}
      </template>
      <template #content>
        <div v-html="getActionDescription(event)"></div>
      </template>
    </Card>

  </Dialog>
</template>


<script lang="ts">
import Dialog from "primevue/dialog";
import {reactive, ref} from "vue";
import {ActionType, ChangeLogNodeParent} from "@/store/change_log";
import {subscribeChangeLogEnriched} from "@/api/change_log";
import Card from "primevue/card";

export default {
  name: "MapChangeLog",
  components: {
    Card,
    Dialog,
  },
  setup() {
    const addDialogVisible = ref(false);
    const changes = reactive([]) as Array<ChangeLogNodeParent>
    subscribeChangeLogEnriched([ActionType.ParentID], [], (changeLogs)=>{
      changes.splice(0, changes.length, ...changeLogs as Array<ChangeLogNodeParent>)
    })
    const getNodeUrl = (nodeIDPath: string, nodeID: string, nodeName: string) => {
      if (nodeIDPath.substring(0, 5) == 'trash') {
        return `<a target="_blank" href="/node_description/${nodeID}">${nodeName}</a>`
      } else {
        return `<a target="_blank" href="/${nodeID}">${nodeName}</a>`
      }
    }
    return {
      toggleAddDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      addDialogVisible,
      changes,
      getActionDescription: (event: ChangeLogNodeParent): string => {
        if (event.isAdded) {
          return `node ${getNodeUrl(event.nodeIDPath, event.nodeID, event.nodeName)} was added to ${getNodeUrl(event.parentNodeIDAfterPath, event.parentNodeIDAfter, event.parentNodeAfterName)}`
        }
        if (event.isRemoved) {
          return `node ${getNodeUrl(event.nodeIDPath, event.nodeID, event.nodeName)} was removed from ${getNodeUrl(event.parentNodeIDBeforePath, event.parentNodeIDBefore, event.parentNodeBeforeName)}`
        }

        return `node ${getNodeUrl(event.nodeIDPath, event.nodeID, event.nodeName)} was moved from ${getNodeUrl(event.parentNodeIDBeforePath, event.parentNodeIDBefore, event.parentNodeBeforeName)} to ${getNodeUrl(event.parentNodeIDAfterPath, event.parentNodeIDAfter, event.parentNodeAfterName)}`
      },
    }
  }
}
</script>
