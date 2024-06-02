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
    :keepInViewPort="false"
    @mousedown.stop
    @update:visible="clearFilter($event)"
  >
    <template #header>
      <div class="p-grid">
        <div class="p-col-1">
          <div style="font-weight: 100;">action:</div>
          <Dropdown
              v-model="filterActionType"
              :options="filterActionTypeOptions"
              optionLabel="name"
              placeholder="All"
              style="width:6em;"
              @change="actionTypeChange($event)"
          />
        </div>
        <div class="p-col-3" style="margin-left:1.5em;">
          <div style="font-weight: 100;">period:</div>
          <span class="p-input-icon-right">
            <i class="pi pi-times" style="cursor: pointer;" @click="clearFilterPeriod" />
            <Calendar
              v-model="filterPeriod"
              @update:modelValue="updateFilterPeriod()"
              selectionMode="range"
              :manualInput="false"
              :hideOnRangeSelection="true"
              showButtonBar
            />
          </span>
        </div>
        <div class="p-col-3" style="margin-left:-0.5em;">
          <div style="font-weight: 100;">user id:</div>
          <span class="p-input-icon-right">
            <i class="pi pi-times" style="cursor: pointer;" @click="clearFilterUserID" />
            <InputText type="text" v-model="filterUserID" style="width:14em;"/>
          </span>
        </div>
        <div class="p-col-3" style="margin-left:0.5em;">
          <div style="font-weight: 100;">node id:</div>
          <span class="p-input-icon-right">
            <i class="pi pi-times" style="cursor: pointer;" @click="clearFilterNodeID" />
            <InputText type="text" v-model="filterNodeID" />
          </span>
        </div>
        <div class="p-col-1" style="margin-left:1em;">
          <div>&nbsp;</div>
          <Button label="Filter"  @click="doFilter" />
        </div>
      </div>

    </template>
    <div v-for="(event, i) of changes" :key="i" class="p-mt-3">
      <ChangeLogCard
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
import Dropdown, {DropdownChangeEvent} from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import {defineComponent, reactive, ref, watch} from "vue";
import {ActionType, ChangeLogEnriched} from "@/store/change_log";
import {subscribeChangeLogEnriched} from "@/api/change_log";
import ChangeLogCard from "@/components/menu/ChangeLogCard.vue";
import MenuButton from "@/components/menu/MenuButton.vue";
import {useRoute, useRouter} from "vue-router";

export default defineComponent({
  name: "ChangeLog",
  components: {
    MenuButton,
    Dialog,
    ChangeLogCard,
    InputText,
    Button,
    Dropdown,
    Calendar,
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
    const filterPeriod = ref();
    const filterActionType = ref();
    const filterActionTypeOptions = ref([
      { name: 'All', code: 'all' },
      { name: 'Content only', code: 'content' },
      { name: 'Map only', code: 'map' },
    ]);
    const logModalVisible = ref(false);
    const changes = reactive([]) as Array<ChangeLogEnriched>;
    const mapActions = [ActionType.ParentID, ActionType.Remove, ActionType.Restore];
    const nodeActions = [ActionType.Name, ActionType.Content, ActionType.Precondition];
    const allActions = [...mapActions, ...nodeActions];
    let unsubscribe = null as any;
    const doFilter = async() => {
      if (unsubscribe) {
        unsubscribe();
      }
      let actions = allActions
      if (filterActionType.value && filterActionType.value.code === 'map') {
        actions = mapActions;
      }
      if (filterActionType.value && filterActionType.value.code === 'content') {
        actions = nodeActions;
      }
      let fromTs = 0;
      let toTs = 0;
      if (filterPeriod.value && filterPeriod.value.length === 2) {
        fromTs = filterPeriod.value[0].getTime()
        toTs = filterPeriod.value[1].getTime() + 24*60*60*1000;
      }
      unsubscribe = await subscribeChangeLogEnriched(
          actions,
          filterNodeID.value && filterNodeID.value.length>0 ? [filterNodeID.value] : [],
          filterUserID.value && filterUserID.value.length>0 ? [filterUserID.value] : [],
          fromTs,
          toTs,
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
    watch(
        () => route.query.logFilterActionType,
        () => {
          if (!route.query || !route.query.logFilterActionType) {
            filterActionType.value = null
          } else {
            filterActionType.value = filterActionTypeOptions.value.find((opt) => opt.code === route.query.logFilterActionType)
          }
          doFilter();
        },
        { immediate: true }
    );
    watch(
        () => route.query.logFilterPeriod,
        () => {
          if (!route.query || !route.query.logFilterPeriod) {
            filterPeriod.value = null
          } else {
            const [fromTs, toTs] = route.query.logFilterPeriod.toString().split('-')
            filterPeriod.value = [
              (new Date(Number(fromTs))),
              (new Date(Number(toTs))),
            ]
          }
          doFilter();
        },
        { immediate: true }
    );

    return {
      filterNodeID,
      filterUserID,
      filterPeriod,
      filterActionType,
      filterActionTypeOptions,
      mapActions,
      nodeActions,
      doFilter,
      actionTypeChange: (event: DropdownChangeEvent) => {
        const query = {} as Record<string, string>
        if (route.query.logFilterNodeID) {
          query['logFilterNodeID'] = route.query.logFilterNodeID.toString()
        }
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        if (route.query.logFilterPeriod) {
          query['logFilterPeriod'] = route.query.logFilterPeriod.toString()
        }
        query['logFilterActionType'] = event.value.code;
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      clearFilter: (isVisible: boolean) => {
        if (isVisible) {
          return
        }
        router.push({
          name: "node",
          params: { id: route.params.id }
        });
      },
      clearFilterNodeID: () => {
        const query = {} as Record<string, string>
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        if (route.query.logFilterPeriod) {
          query['logFilterPeriod'] = route.query.logFilterPeriod.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
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
        if (route.query.logFilterPeriod) {
          query['logFilterPeriod'] = route.query.logFilterPeriod.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
        }
        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      updateFilterPeriod: () => {
        const query = {} as Record<string, string>
        if (route.query.logFilterNodeID) {
          query['logFilterNodeID'] = route.query.logFilterNodeID.toString()
        }
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
        }
        if (filterPeriod.value && filterPeriod.value[0] && filterPeriod.value[1]) {
          query['logFilterPeriod'] = `${filterPeriod.value[0].getTime()}-${filterPeriod.value[1].getTime()}`;
        }

        router.push({
          name: "node",
          params: { id: route.params.id },
          query,
        });
      },
      clearFilterPeriod: () => {
        const query = {} as Record<string, string>
        if (route.query.logFilterNodeID) {
          query['logFilterNodeID'] = route.query.logFilterNodeID.toString()
        }
        if (route.query.logFilterUserID) {
          query['logFilterUserID'] = route.query.logFilterUserID.toString()
        }
        if (route.query.logFilterActionType) {
          query['logFilterActionType'] = route.query.logFilterActionType.toString()
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
