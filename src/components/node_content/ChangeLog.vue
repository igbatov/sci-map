<template>
  <Fieldset legend="change log" :toggleable="true" :collapsed="collapsed" @update:collapsed="toggle($event)">
    <div class="m-0">
      <Card
          v-for="(event, i) of changes"
          :key="i"
          class="mt-3"
      >
        <template #title>
          {{ event.userID }}
        </template>
        <template #subtitle>
          {{ event.timestamp }} / {{ event.action }}
        </template>
        <template #content>
          {{ event.attributes.value }}
        </template>
      </Card>
    </div>
  </Fieldset>
</template>

<script lang="ts">
import Fieldset from 'primevue/fieldset';
import Card from 'primevue/card';
import api from "@/api/api";
import {ref, reactive, watch} from "vue";
import { ChangeLog } from '@/store/change_log';

export default {
  name: "ChangeLog",
  props: {
    nodeId: String
  },
  components: {
    Fieldset,
    Card,
  },
  setup(props: { nodeId: string }) {
    const collapsed = ref(true)
    const changes = reactive([]) as Array<ChangeLog>
    let unsubscribe = ()=>{ /**/ }
    watch(() => [props.nodeId, collapsed.value], async (newArgs, oldArgs) => {
      if (newArgs[0] != oldArgs[0]) {
        collapsed.value = true
      }
      unsubscribe()
      unsubscribe = ()=>{ /**/ }
      if (collapsed.value == false) {
        unsubscribe = await api.subscribeChangeLog(['name', 'content'], [props.nodeId], (changeLogs)=>{
          changes.splice(0, changes.length, ...changeLogs)
        })
      }
    });
    return {
      changes,
      collapsed,
      toggle: (event: any) => {
        collapsed.value = event
      }
    }
  }
}
</script>
