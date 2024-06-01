<template>
  <MenuButton @click="toggleLogModalVisible">
    <img alt="icon" src="../../assets/images/log.svg" style="width: 20px" />
    <span class="p-ml-2">log</span>
  </MenuButton>
  <Dialog
    v-model:visible="logModalVisible"
    :dismissableMask="false"
    :closable="true"
    :modal="false"
    :closeOnEscape="true"
    @mousedown.stop
  >
    <template #header>
        node id:
      <span class="p-input-icon-right">
        <i class="pi pi-times" style="cursor: pointer;" @click="clearFilterNodeID" />
        <InputText type="text" v-model="filterNodeID" />
      </span>
        user id:
      <span class="p-input-icon-right">
        <i class="pi pi-times" style="cursor: pointer;" @click="clearFilterUserID" />
        <InputText type="text" v-model="filterUserID" />
      </span>
      <Button label="Filter" icon="pi pi-check" @click="doFilter" />
    </template>
    <div v-for="(event, i) of changes" :key="i" class="p-mt-3">
      <ChangeMapCard
        :event="event"
        :clickedTitleId="clickedTitleId"
        @restore-select-new-parent-is-on="$emit('restore-select-new-parent-is-on')"
        @restore-select-new-parent-is-off="$emit('restore-select-new-parent-is-off')"
      />
    </div>
  </Dialog>
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import {defineComponent, reactive, ref, watch} from "vue";
import {ActionType, ChangeLogEnriched} from "@/store/change_log";
import {subscribeChangeLogEnriched} from "@/api/change_log";
import ChangeMapCard from "@/components/menu/ChangeMapCard.vue";
import MenuButton from "@/components/menu/MenuButton.vue";
import {useRoute, useRouter} from "vue-router";

export default defineComponent({
  name: "MapChangeLog",
  components: {
    MenuButton,
    Dialog,
    ChangeMapCard,
    InputText,
    Button,
  },
  emits: ["restore-select-new-parent-is-on", "restore-select-new-parent-is-off"],
  props: {
    clickedTitleId: {
      type: String,
      required: true
    }
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const filterNodeID = ref("");
    const filterUserID = ref("");
    const logModalVisible = ref(false);
    const changes = reactive([]) as Array<ChangeLogEnriched>;
    const mapActions = [ActionType.ParentID, ActionType.Remove, ActionType.Restore];
    const nodeActions = [ActionType.Name, ActionType.Content, ActionType.Precondition];
    const allActions = mapActions;
    allActions.push(...nodeActions);
    let unsubscribe = null as any;
    const doFilter = async() => {
      if (unsubscribe) {
        unsubscribe();
      }
      unsubscribe = await subscribeChangeLogEnriched(
          allActions,
          filterNodeID.value && filterNodeID.value.length>0 ? [filterNodeID.value] : [],
          filterUserID.value && filterUserID.value.length>0 ? [filterUserID.value] : [],
          changeLogs => {
            changes.splice(
                0,
                changes.length,
                ...(changeLogs as Array<ChangeLogEnriched>)
            );
          });
    };
    watch(
        () => route.query.logFilterUserID,
        () => {
          filterUserID.value = route.query && route.query.logFilterUserID ? route.query.logFilterUserID.toString() : '';
          doFilter();
        },
        { immediate: true }
    );
    watch(
        () => route.query.logFilterNodeID,
        () => {
          filterNodeID.value = route.query && route.query.logFilterNodeID ? route.query.logFilterNodeID.toString() : '';
          doFilter();
        },
        { immediate: true }
    );

    return {
      filterNodeID,
      filterUserID,
      mapActions,
      nodeActions,
      doFilter,
      clearFilterNodeID: () => {
        const query = {} as Record<string, string>
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      clearFilterUserID: () => {
        const query = {} as Record<string, string>
        if (route.query.logFilterNodeID) {
          query['logFilterNodeID'] = route.query.logFilterNodeID.toString()
        }
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      toggleLogModalVisible: () => (logModalVisible.value = !logModalVisible.value),
      logModalVisible,
      changes,
    };
  }
});
</script>
