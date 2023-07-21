<template>
  <div class="p-grid">
    <div class="p-col-3">
      <h3>Crowdfunding</h3>
    </div>
    <div v-if="!showForm" class="p-col-1">
      <Button
        icon="pi pi-plus"
        class="p-button-rounded"
        @click="showForm = true"
        @mousedown="checkAuthorized"
      />
    </div>
  </div>

  <div v-if="showForm">
    <div v-for="field of fields" class="p-field p-grid" :key="field.key">
      <label :for="field.key" class="p-col-3 p-mb-0">{{ field.label }}</label>
      <div class="p-col-8">
        <InputText :id="field.key" type="text" v-model="field.value" />
      </div>
    </div>
    <div class="p-field p-grid">
      <div class="p-col-4">
        <Button
          label="Cancel"
          @click="showForm = false"
          class="p-button-rounded p-button-help"
        />
      </div>
      <div class="p-col-4">
        <Button
          label="Add"
          @click="add()"
          class="p-button-rounded p-button-help"
        />
      </div>
    </div>
  </div>

  <div v-for="item of crowdfundingArray" class="p-grid" :key="item.id">
    <div class="p-col-12" v-if="!item.spam">
      <div class="p-grid">
        <div class="p-col-11">
          {{ item.title }}
        </div>
        <div class="p-col-1">
          <Button
            v-if="item.authorID === currentUserID"
            @click="remove(crw.id)"
            icon="pi pi-ban"
            class="p-button-rounded p-button-help p-button-outlined"
          />
          <Button
            v-else
            @click="reportSpam(item.id)"
            icon="pi pi-exclamation-circle"
            class="p-button-rounded p-button-help p-button-outlined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { actions, useStore } from "@/store";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { computed, PropType, ref } from "vue";
import { Crowdfunding, EmptyCrowdfunding } from "@/store/node_content";
import { clone } from "@/tools/utils";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

export default {
  name: "Crowdfunding",
  props: {
    nodeId: Number,
    crowdfundingList: Object as PropType<Record<string, Crowdfunding>>
  },
  components: {
    Button,
    InputText
  },
  setup(props: {
    nodeId: string;
    crowdfundingList: Record<string, Crowdfunding>;
  }) {
    const store = useStore();
    const confirm = useConfirm();
    const toast = useToast();

    const showForm = ref(false);
    const fields = ref([
      { key: "title", label: "Title", value: "" },
      { key: "url", label: "URL", value: "" },
      { key: "description", label: "Description", value: "" },
      { key: "organization", label: "Organization", value: "" },
      { key: "published", label: "Published", value: "" }, // date in UTC seconds from epoch
      { key: "applicationDeadline", label: "Application deadline", value: "" } // date in UTC seconds from epoch
    ]);

    const currentUserID = computed(() =>
      store.state.user.user ? store.state.user.user.uid : 0
    );
    return {
      currentUserID,
      showForm,
      fields,
      crowdfundingArray: computed(() =>
        props.crowdfundingList ? Object.values(props.crowdfundingList) : []
      ),
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault()
        }
      },
      add: async () => {
        const crowdfunding = clone(EmptyCrowdfunding);
        for (const field of fields.value) {
          const key = field.key as keyof Crowdfunding;
          crowdfunding[key] = field.value;
        }
        crowdfunding.authorID = currentUserID.value;
        await store.dispatch(`${actions.addCrowdfunding}`, {
          nodeID: props.nodeId,
          crowdfunding: crowdfunding
        });
        showForm.value = false;
        for (const field of fields.value) {
          field.value = "";
        }
      },
      remove: (id: string) => {
        store.dispatch(`${actions.removeCrowdfunding}`, {
          nodeID: props.nodeId,
          crowdfundingID: id
        });
      },
      reportSpam: (id: string) => {
        confirm.require({
          message:
            "This will set resource as spam and remove it from your list. This cannot be undone. Are you sure?",
          header: "Confirmation",
          icon: "pi pi-exclamation-triangle",
          accept: async () => {
            await store.dispatch(`${actions.reportSpam}`, {
              nodeID: props.nodeId,
              type: "crowdfundingList",
              id: id,
              spam: 1
            });
            const title = props.crowdfundingList[id].title;
            toast.add({
              severity: "info",
              summary: "Confirmed",
              detail: `"${title}" was removed as spam`,
              life: 3000
            });
          },
          reject: () => {
            return;
          }
        });
      }
    };
  }
};
</script>
