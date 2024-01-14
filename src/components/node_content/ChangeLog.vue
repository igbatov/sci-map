<template>
  <Fieldset legend="change log" :toggleable="true" :collapsed="collapsed" @update:collapsed="toggle($event)">
    <div class="m-0">
      <Card
          v-for="(event, i) of changes"
          :key="i"
          class="mt-3"
      >
        <template #title>
          {{ (new Date(event.timestamp)).toLocaleDateString() }} {{ (new Date(event.timestamp)).toLocaleTimeString() }}
        </template>
        <template #subtitle>
          {{ event.userDisplayName }} / {{ event.action }} change
        </template>
        <template #content>
          {{ event.action == ActionType.Name ? event.newName : (event.action == ActionType.Content ? event.newContent : '') }}
        </template>
      </Card>
    </div>
  </Fieldset>
</template>

<script lang="ts">
import Fieldset from 'primevue/fieldset';
import Card from 'primevue/card';
import {subscribeChangeLogEnriched} from "@/api/change_log";
import {ref, reactive, watch} from "vue";
import {ActionType, ChangeLogEnriched, ChangeLogNodeParent} from '@/store/change_log';

export default {
  name: "ChangeLog",
  computed: {
    ActionType() {
      return ActionType
    }
  },
  props: {
    nodeId: String
  },
  components: {
    Fieldset,
    Card,
  },
  setup(props: { nodeId: string }) {
    const collapsed = ref(true)
    const changes = reactive([]) as Array<ChangeLogEnriched>
    let unsubscribe = ()=>{ /**/ }
    watch(() => [props.nodeId, collapsed.value], async (newArgs, oldArgs) => {
      if (newArgs[0] != oldArgs[0]) {
        collapsed.value = true
      }
      unsubscribe()
      unsubscribe = ()=>{ /**/ }
      if (collapsed.value == false) {
        unsubscribe = await subscribeChangeLogEnriched([ActionType.Name, ActionType.Content], [props.nodeId], (changeLogs)=>{
          changes.splice(0, changes.length, ...changeLogs)
        })
      }
    });
    return {
      changes,
      collapsed,
      toggle: (event: any) => {
        collapsed.value = event
      },
    }
  }
}
</script>
