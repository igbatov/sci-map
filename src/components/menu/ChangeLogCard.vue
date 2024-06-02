<template>
  <ChangeLogComplain
      :show="complainModalVisible"
      :complainChangeLink="complainChangeLink"
      @hide="complainModalVisible = false"
  />
  <Card class="p-mt-3">
    <template #subtitle>
      <div class="p-grid">
        <div class="p-col-1">
          <img alt="action add" v-if="event.isAdded" src="../../assets/images/add-off.svg"  style="width: 30px"/>
          <img alt="action remove" v-else-if="event.isRemoved" src="../../assets/images/trash-bin.svg"  style="width: 30px"/>
          <img alt="action move" v-else-if="event.action === ActionType.ParentID" src="../../assets/images/move.svg"  style="width: 20px"/>
          <img alt="action edit name" v-else-if="event.action === ActionType.Name" src="../../assets/images/edit.svg"  style="width: 20px"/>
          <img alt="action edit content" v-else-if="event.action === ActionType.Content" src="../../assets/images/edit.svg"  style="width: 20px"/>
          <img alt="action edit 'based on'" v-else-if="event.action === ActionType.Precondition" src="../../assets/images/plugin.svg"  style="width: 25px"/>
        </div>
        <div class="p-col-3">
          <div style="font-weight: 100;">At</div>
          <div style="font-weight: 900;">{{ new Date(event.timestamp).toLocaleDateString() }}
            {{ new Date(event.timestamp).toLocaleTimeString() }}</div>
        </div>
        <div class="p-col-3">
          <div style="font-weight: 100;">user</div>
          <a
              href="#"
              style="font-weight: 900; display: inline-block; position: relative; top: -5px; cursor: pointer;"
              @click="filterByUserID(event.userID)"
          >
            {{ event.userDisplayName }}
          </a>
          <img
              @click="showComplain(event.changeLogID)"
               alt="complain" src="../../assets/images/exclamation.svg"
               style="width: 20px; cursor: pointer; position: relative; top: -2px; left: 0.5em;"
          />
        </div>
        <div class="p-col-4">
          <div style="font-weight: 100;">changed node</div>
          <a  href="#" style="font-weight: 900; display: inline; cursor: pointer;" @click="filterByNodeID(event.node.id)">{{event.node.name}}</a>
          &nbsp;<a :href="GetNodeHref(event.node.idPath, event.node.id)">[&nearr;]</a>
          <div style="font-weight: 100; display: inline; margin-left:0.5em;">{{ event.action }}</div>
        </div>
        <div
            v-if="event.isRemoved && event.node.idPath.startsWith('trash')"
            class="p-col-1"
        >
          <RestoreNode
              @restore-select-new-parent-is-on="$emit('restore-select-new-parent-is-on')"
              @restore-select-new-parent-is-off="$emit('restore-select-new-parent-is-off')"
              :clickedTitleId="clickedTitleId"
              :event="event"
          />
        </div>
      </div>
    </template>
    <template #content v-if="event.action == ActionType.Name">
      <Diff
          :mode="'split'"
          :theme="'light'"
          :language="'plaintext'"
          :prev="event.oldName ? event.oldName : ''"
          :current="event.newName ? event.newName : ''"
      />
    </template>
    <template #content v-else-if="event.action == ActionType.Content && event.newContent">
      <Diff
          :mode="'split'"
          :theme="'light'"
          :language="'plaintext'"
          :prev="event.oldContent ? event.oldContent : ''"
          :current="event.newContent ? event.newContent : ''"
      />
<!--      <Markdown :content="event.newContent" :rows="2" :allowEdit="false"/>-->
    </template>
    <template #content v-else-if="event.action == ActionType.Precondition">
      <div style="width:60rem;" v-html="getContent(event)" />
    </template>
    <template #content v-else-if="mapActions.indexOf(event.action) !== -1">
      <div style="width:60rem;" v-html="getMapActionDescription(event)"></div>
    </template>
  </Card>
</template>

<script lang="ts">
import RestoreNode from "@/components/menu/RestoreNode.vue";
import {defineComponent, PropType, ref} from "vue";
import {ActionType, ChangeLogEnriched, ChangeLogNodeParent, ChangeLogNodePrecondition} from "@/store/change_log";
import {GetNodeLink, GetNodeHref} from "@/api/change_log";
import Card from "primevue/card";
import ChangeLogComplain from "@/components/node_content/ChangeLogComplain.vue";
import Markdown from "@/components/node_content/Markdown.vue";
import {useRouter, useRoute} from "vue-router";

export default defineComponent({
  name: "ChangeLogCard",
  components: {
    // Markdown,
    ChangeLogComplain,
    RestoreNode,
    Card,
  },
  emits: [
    "restore-select-new-parent-is-on",
    "restore-select-new-parent-is-off"
  ],
  props: {
    clickedTitleId: {
      type: String,
      required: true
    },
    event: {
      type: Object as PropType<ChangeLogEnriched>,
      required: true,
    },
  },
  computed: {
    ActionType() {
      return ActionType;
    }
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const mapActions = [ActionType.ParentID, ActionType.Remove, ActionType.Restore];
    const complainChangeLink = ref("");
    const complainModalVisible = ref(false);
    return {
      GetNodeHref: GetNodeHref,
      filterByNodeID: (nodeID: string) => {
        const query = {} as Record<string, string>
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
        }
        query['logFilterNodeID'] = nodeID;
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      filterByUserID: (userID: string) => {
        const query = {} as Record<string, string>
        if (route.query.logFilterNodeID) {
          query['logFilterNodeID'] = route.query.logFilterNodeID.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
        }
        query['logFilterUserID'] = userID;
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      mapActions,
      complainChangeLink,
      complainModalVisible,
      showComplain: (id: string) => {
        complainModalVisible.value = true;
        complainChangeLink.value = "https://scimap.org/change/" + id;
      },
      getContent: (event: ChangeLogEnriched) => {
        event = event as ChangeLogNodePrecondition;
        const removed = [];
        for (const cd of event.removed) {
          removed.push(GetNodeLink(cd.idPath, cd.id, cd.name));
        }
        const added = [];
        for (const cd of event.added) {
          added.push(GetNodeLink(cd.idPath, cd.id, cd.name));
        }

        let result = "";
        if (removed.length > 0) {
          result += `removed from "based on": ${removed.join(", ")}`;
        }
        if (added.length > 0) {
          result += `<br> added to "based on": ${added.join(", ")}`;
        }
        return result;
      },
      getMapActionDescription: (event: ChangeLogNodeParent): string => {
        if (event.action === ActionType.Restore) {
          return `node ${GetNodeLink(
              event.node.idPath,
              event.node.id,
              event.node.name
          )} was restored to ${GetNodeLink(
              event.parentNodeAfter!.idPath,
              event.parentNodeAfter!.id,
              event.parentNodeAfter!.name
          )}`;
        }
        if (event.isAdded) {
          return `node ${GetNodeLink(
              event.node.idPath,
              event.node.id,
              event.node.name
          )} was added to ${GetNodeLink(
              event.parentNodeAfter!.idPath,
              event.parentNodeAfter!.id,
              event.parentNodeAfter!.name
          )}`;
        }
        if (event.isRemoved) {
          return `node ${GetNodeLink(
              event.node.idPath,
              event.node.id,
              event.node.name
          )} was removed from ${GetNodeLink(
              event.parentNodeBefore!.idPath,
              event.parentNodeBefore!.id,
              event.parentNodeBefore!.name
          )}`;
        }

        return `node ${GetNodeLink(
            event.node.idPath,
            event.node.id,
            event.node.name
        )} was moved from ${GetNodeLink(
            event.parentNodeBefore!.idPath,
            event.parentNodeBefore!.id,
            event.parentNodeBefore!.name
        )} to ${GetNodeLink(
            event.parentNodeAfter!.idPath,
            event.parentNodeAfter!.id,
            event.parentNodeAfter!.name
        )}`;
      }
    }
  }
});
</script>
