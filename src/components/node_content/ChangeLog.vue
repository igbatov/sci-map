<template>
  <ChangeLogComplain
      :show="complainModalVisible"
      :complainChangeLink="complainChangeLink"
      @hide="complainModalVisible = false"
  />
  <Fieldset legend="change log" :toggleable="true" :collapsed="collapsed" @update:collapsed="toggle($event)">
    <div v-if="!isAuthorized">
      Sign in to see node change log
    </div>
    <div v-else class="m-0">
      <Card
          v-for="(event, i) of changes"
          :key="i"
          class="mt-3"
      >
        <template #title>
          {{ (new Date(event.timestamp)).toLocaleDateString() }} {{ (new Date(event.timestamp)).toLocaleTimeString() }} / {{ event.action }} change
        </template>
        <template #subtitle>
          {{ !!event.userDisplayName ? event.userDisplayName : `user id ${event.userID}` }} / <a href="#" @click="showComplain(event.changeLogID)">Complain</a>
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
import {ref, reactive, watch, computed} from "vue";
import {ActionType, ChangeLogEnriched} from '@/store/change_log';
import {useStore} from "@/store";
import ChangeLogComplain from "@/components/node_content/ChangeLogComplain.vue";

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
    ChangeLogComplain,
    Fieldset,
    Card,
  },
  setup(props: { nodeId: string }) {
    const store = useStore();
    const isAuthorized = computed(() => (store.state.user.user && !store.state.user.user.isAnonymous));
    const complainChangeLink = ref('')
    const complainModalVisible = ref(false);
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
      showComplain: (id: string) => {
        complainModalVisible.value = true
        complainChangeLink.value = 'https://scimap.org/change/'+id
      },
      complainModalVisible,
      complainChangeLink,
      isAuthorized,
    }
  }
}
</script>
