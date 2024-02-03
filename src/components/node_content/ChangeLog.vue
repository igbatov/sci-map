<template>
  <ChangeLogComplain
    :show="complainModalVisible"
    :complainChangeLink="complainChangeLink"
    @hide="complainModalVisible = false"
  />
  <Fieldset
    legend="change log"
    :toggleable="true"
    :collapsed="collapsed"
    @update:collapsed="toggle($event)"
    :pt="{
      legend: { class: 'bg-primary' }
    }"
  >
    <div v-if="!isAuthorized">
      Sign in to see node change log
    </div>
    <div v-else class="m-0">
      <Card v-for="(event, i) of changes" :key="i" class="mt-3">
        <template #title>
          {{ new Date(event.timestamp).toLocaleDateString() }}
          {{ new Date(event.timestamp).toLocaleTimeString() }} /
          {{ event.action }} change
        </template>
        <template #subtitle>
          {{
            !!event.userDisplayName
              ? event.userDisplayName
              : `user id ${event.userID}`
          }}
          / <a href="#" @click="showComplain(event.changeLogID)">Complain</a>
        </template>
        <template #content v-if="event.action == ActionType.Name">
          {{ event.newName }}
        </template>
        <template #content v-else-if="event.action == ActionType.Content">
          <Markdown :content="event.newContent" :rows="10" />
        </template>
        <template #content v-else-if="event.action == ActionType.Precondition">
          <div v-html="getContent(event)" />
        </template>
      </Card>
    </div>
  </Fieldset>
</template>

<script lang="ts">
import Fieldset from "primevue/fieldset";
import Card from "primevue/card";
import { subscribeChangeLogEnriched, GetNodeUrl } from "@/api/change_log";
import { computed, reactive, ref, watch, defineComponent } from "vue";
import {
  ActionType,
  ChangeLogEnriched,
  ChangeLogNodePrecondition
} from "@/store/change_log";
import { useStore } from "@/store";
import ChangeLogComplain from "@/components/node_content/ChangeLogComplain.vue";
import Markdown from "@/components/node_content/Markdown.vue";

export default defineComponent({
  name: "ChangeLog",
  computed: {
    ActionType() {
      return ActionType;
    }
  },
  props: {
    nodeId: {
      type: String,
      required: true
    }
  },
  components: {
    Markdown,
    ChangeLogComplain,
    Fieldset,
    Card
  },
  setup(props) {
    const store = useStore();
    const isAuthorized = computed(
      () => store.state.user.user && !store.state.user.user.isAnonymous
    );
    const complainChangeLink = ref("");
    const complainModalVisible = ref(false);
    const collapsed = ref(true);
    const changes = reactive([]) as Array<ChangeLogEnriched>;
    let unsubscribe = () => {
      /**/
    };
    watch(
      () => [props.nodeId, collapsed.value],
      async (newArgs, oldArgs) => {
        if (newArgs[0] != oldArgs[0]) {
          collapsed.value = true;
        }
        unsubscribe();
        unsubscribe = () => {
          /**/
        };
        if (collapsed.value == false) {
          unsubscribe = await subscribeChangeLogEnriched(
            [ActionType.Name, ActionType.Content, ActionType.Precondition],
            [props.nodeId],
            changeLogs => {
              changes.splice(0, changes.length, ...changeLogs);
            }
          );
        }
      }
    );
    return {
      changes,
      collapsed,
      toggle: (event: boolean) => {
        collapsed.value = event;
      },
      showComplain: (id: string) => {
        complainModalVisible.value = true;
        complainChangeLink.value = "https://scimap.org/change/" + id;
      },
      getContent: (event: ChangeLogEnriched) => {
        event = event as ChangeLogNodePrecondition;
        const removed = [];
        for (const cd of event.removed) {
          removed.push(GetNodeUrl(cd.idPath, cd.id, cd.name));
        }
        const added = [];
        for (const cd of event.added) {
          added.push(GetNodeUrl(cd.idPath, cd.id, cd.name));
        }

        let result = "";
        if (removed.length > 0) {
          result += `removed: ${removed.join(", ")}`;
        }
        if (added.length > 0) {
          result += `<br> added: ${added.join(", ")}`;
        }
        return result;
      },
      complainModalVisible,
      complainChangeLink,
      isAuthorized
    };
  }
});
</script>
