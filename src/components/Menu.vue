<template>
  <div :class="$style.wrapper">
    <div v-if="email">
      {{ email }}
      <button @click="toggleAddDialog">+</button>
      <button @click="save">Save</button>
      <button @click="signOut">Sign Out</button>
    </div>
    <button v-else @click="signIn">
      Sign In
    </button>
  </div>
  <Dialog
      v-model:visible="addDialogVisible"
      :dismissableMask="true"
      :closable="true"
      :modal="true"
      :closeOnEscape="true"
  >
    <template #header>
      <h3>{{selectedNodeTitle ? `Add subsection to ${selectedNodeTitle}` : `Add section` }}</h3>
    </template>

    <Input type="text" v-model="newNodeTitle"/>

    <template #footer>
      <Button label="No" icon="pi pi-times" class="p-button-text" @click="cancelAdd"/>
      <Button label="Yes" icon="pi pi-check" @click="add" />
    </template>
  </Dialog>
</template>

<script>
import { useStore } from "@/store";
import { computed, ref } from "vue";
import { actions as userActions } from "@/store/user";
import { mutations as treeMutations } from "@/store/tree";
import api from "@/api/api";
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Input from 'primevue/inputtext';

export default {
  name: "Menu",
  components: {
    Dialog,
    Button,
    Input,
  },
  setup() {
    const store = useStore();
    const user = store.state.user;

    // user info
    const email = computed(() => (user.user ? user.user.email : null));

    // add new node
    const addDialogVisible = ref(false)
    const selectedNode = computed(() => store.getters['tree/selectedNode'])
    const newNodeTitle = ref("")

    return {
      email,
      // SignIn SignOut
      signIn: () => store.dispatch(`user/${userActions.signIn}`),
      signOut: () => store.dispatch(`user/${userActions.signOut}`),
      // save
      save: () => api.saveMap(user.user, store.state.tree.tree),
      // add new node
      selectedNodeTitle: computed(() => selectedNode.value ? selectedNode.value.title : ""),
      toggleAddDialog: () => addDialogVisible.value = !addDialogVisible.value,
      add: () => store.commit(
  `tree/${treeMutations.ADD_NODE}`,
{parentId: selectedNode.value ? selectedNode.value.id : null,  title: newNodeTitle.value},
      ),
      cancelAdd: () => {
        newNodeTitle.value = "";
        addDialogVisible.value = false;
      },
      addDialogVisible,
      newNodeTitle,
    };
  }
};
</script>

<style module>
.wrapper {
  position: fixed;
  display: flex;
  justify-content: end;
  padding: 8px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
