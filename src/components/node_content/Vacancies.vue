<template>
  <div class="p-grid">
    <div class="p-col-3">
      <h3>Vacancies</h3>
    </div>
    <div v-if="!showForm" class="p-col-1">
      <Button
        icon="pi pi-plus"
        class="p-button-rounded"
        @mousedown="checkAuthorized"
        @click="showForm = true"
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

  <div v-for="item of vacancyArray" class="p-grid" :key="item.id">
    <div class="p-col-12" v-if="!item.spam">
      <div class="p-grid">
        <div class="p-col-11">
          {{ item.title }}
        </div>
        <div class="p-col-1">
          <Button
            v-if="item.authorID === currentUserID"
            @click="remove(item.id)"
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
import { EmptyVacancy, Vacancy } from "@/store/node_content";
import { clone } from "@/tools/utils";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

export default {
  name: "Vacancies",
  props: {
    nodeId: String,
    vacancies: Object as PropType<Record<string, Vacancy>>
  },
  components: {
    Button,
    InputText
  },
  setup(props: { nodeId: string; vacancies: Record<string, Vacancy> }) {
    const store = useStore();
    const confirm = useConfirm();
    const toast = useToast();
    const showForm = ref(false);

    const fields = ref([
      { key: "title", label: "Title", value: "" },
      { key: "url", label: "URL", value: "" },
      { key: "salary", label: "Salary", value: "" },
      { key: "description", label: "Description", value: "" },
      { key: "organization", label: "Organization", value: "" },
      { key: "place", label: "Place", value: "" },
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
      vacancyArray: computed(() =>
        props.vacancies ? Object.values(props.vacancies) : []
      ),
      checkAuthorized: async (e: Event) => {
        if (!store.state.user.user || store.state.user.user.isAnonymous) {
          await store.dispatch(`${actions.confirmSignInPopup}`, confirm);
          e.preventDefault();
        }
      },
      add: async () => {
        const vacancy = clone(EmptyVacancy);
        for (const field of fields.value) {
          const key = field.key as keyof Vacancy;
          vacancy[key] = field.value;
        }
        vacancy.authorID = currentUserID.value;
        await store.dispatch(`${actions.addVacancy}`, {
          nodeID: props.nodeId,
          vacancy: vacancy
        });
        showForm.value = false;
        for (const field of fields.value) {
          field.value = "";
        }
      },
      remove: (id: string) => {
        store.dispatch(`${actions.removeVacancy}`, {
          nodeID: props.nodeId,
          vacancyID: id
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
              type: "vacancies",
              id: id,
              spam: 1
            });
            const title = props.vacancies[id].title;
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
