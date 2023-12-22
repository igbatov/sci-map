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
        {{ event.userID }}
      </template>
      <template #subtitle>
        {{ event.timestamp }}
      </template>
      <template #content>
        {{ event.attributes.valueAfter }}
      </template>
    </Card>

  </Dialog>
</template>


<script lang="ts">
import Dialog from "primevue/dialog";
import {reactive, ref} from "vue";
import {ActionType, ChangeLog} from "@/store/change_log";
import {subscribeChangeLog} from "@/api/change_log";
import Card from "primevue/card";

export default {
  name: "MapChangeLog",
  components: {
    Card,
    Dialog,
  },
  setup() {
    const addDialogVisible = ref(false);
    const changes = reactive([]) as Array<ChangeLog>
    subscribeChangeLog([ActionType.ParentID], [], (changeLogs)=>{
      changes.splice(0, changes.length, ...changeLogs)
    })
    return {
      toggleAddDialog: () => (addDialogVisible.value = !addDialogVisible.value),
      addDialogVisible,
      changes,
    }
  }
}
</script>
