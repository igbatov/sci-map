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
    style="width:66rem;"
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
              @change="actionTypeChange($event.value.code)"
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
    <div>
      <div v-for="(event, i) of changes" :key="i" class="p-mt-3">
        <ChangeLogCard
          :event="event"
          :clickedTitleId="clickedTitleId"
          @restore-select-new-parent-is-on="$emit('restore-select-new-parent-is-on')"
          @restore-select-new-parent-is-off="$emit('restore-select-new-parent-is-off')"
        />
      </div>
      <InfiniteLoading @infinite="loadMoreChanges" />
    </div>
  </Dialog>
</template>

<script lang="ts">
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import {defineComponent, reactive, ref, watch} from "vue";
import {ActionType, ChangeLogEnriched} from "@/store/change_log";
import {subscribeChangeLogEnriched} from "@/api/change_log";
import ChangeLogCard from "@/components/menu/ChangeLogCard.vue";
import MenuButton from "@/components/menu/MenuButton.vue";
import {useRoute, useRouter} from "vue-router";
import InfiniteLoading from "v3-infinite-loading";
import {useToast} from "primevue/usetoast";

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
    InfiniteLoading,
  },
  emits: ["restore-select-new-parent-is-on", "restore-select-new-parent-is-off"],
  props: {
    clickedTitleId: {
      type: String,
      required: true
    }
  },
  setup() {
    const PAGE_SIZE = 50;
    const LIMIT_MAX_SIZE = 1000;
    let currentLimit = PAGE_SIZE
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
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

    const actionTypeChange = (actionTypeCode: string) => {
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
      query['logFilterActionType'] = actionTypeCode;
      router.push({
        name: "node",
        params: { id: route.params.id },
        query,
      });
    };

    const clearFilterPeriod = () => {
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
    }

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
        fromTs = filterPeriod.value[0].getTime();
        toTs = filterPeriod.value[1].getTime() + 24*60*60*1000;
      }
      unsubscribe = await subscribeChangeLogEnriched(
          actions,
          filterNodeID.value && filterNodeID.value.length>0 ? [filterNodeID.value] : [],
          filterUserID.value && filterUserID.value.length>0 ? [filterUserID.value] : [],
          fromTs,
          toTs,
          currentLimit,
          changeLogs => {
            changes.splice(
                0,
                changes.length,
                ...(changeLogs as Array<ChangeLogEnriched>)
            );
          });
    };

    watch(
        () => [
          route.query.logFilterUserID,
          route.query.logFilterNodeID,
          route.query.logFilterActionType,
          route.query.logFilterPeriod,
        ],
        (newValues) => {
          logModalVisible.value = false;
          if (!route.query) {
            filterUserID.value = ""
            filterNodeID.value = ""
            filterActionType.value = ""
            filterPeriod.value = ""
            if (unsubscribe) {
              unsubscribe();
            }
            return
          }
          if (newValues[0]) {
            filterUserID.value = newValues[0].toString();
            logModalVisible.value = true;
          } else {
            filterUserID.value = "";
          }
          if (newValues[1]) {
            filterNodeID.value = newValues[1].toString();
            logModalVisible.value = true;
          } else {
            filterNodeID.value = "";
          }
          if (newValues[2]) {
            filterActionType.value = filterActionTypeOptions.value.find((opt) => opt.code === newValues[2]);
            logModalVisible.value = true;
          } else {
            filterActionType.value = null;
          }
          if (newValues[3]) {
            const [fromTs, toTs] = newValues[3].toString().split('-');
            filterPeriod.value = [
              (new Date(Number(fromTs))),
              (new Date(Number(toTs))),
            ];
            logModalVisible.value = true;
          } else {
            filterPeriod.value = null;
          }
          // if filter changed we start from first page
          currentLimit = PAGE_SIZE;
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
      actionTypeChange,
      loadMoreChanges: (state: any) => {
        currentLimit = currentLimit + PAGE_SIZE;
        if (currentLimit > LIMIT_MAX_SIZE) {
          toast.add({
            severity: "info",
            summary: "Max log size for one page exceeded",
            detail: "Please use filters to reduce numbers of logs",
            life: 5000
          });
          currentLimit = LIMIT_MAX_SIZE;
        }
        doFilter();
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
      clearFilterPeriod,
      toggleLogModalVisible: () => {
        if (!logModalVisible.value) {
          actionTypeChange('map')
        }
      },
      logModalVisible,
      changes,
    };
  }
});
</script>
