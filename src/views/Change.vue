<template>
  <h1 v-if="!isAuthorized">Only authorized users can view changes</h1>
  <div v-else>
    <div><b>id:</b> {{ route.params.id }}</div>
    <div>
      <b>timestamp:</b>
      {{ new Date(change["timestamp"]).toLocaleDateString() }}
      {{ new Date(change["timestamp"]).toLocaleTimeString() }}
    </div>
    <div><b>action:</b> {{ change["action"] }}</div>
    <div><b>node_id:</b> {{ change["node_id"] }}</div>
    <div><b>user_id:</b> {{ change["user_id"] }}</div>
    <b>value:</b>
    <Markdown
      v-if="['content', 'name'].indexOf(change['action']) != -1"
      :content="change['attributes']['value']"
      :rows="20"
    />
    <div v-else>{{ JSON.stringify(change["attributes"]) }}</div>
  </div>
</template>

<script lang="ts">
import { useRoute } from "vue-router";
import { useStore } from "@/store";
import { computed, watch, ref } from "vue";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import Markdown from "@/components/node_content/Markdown.vue";

export default {
  name: "Change",
  components: { Markdown },

  setup() {
    const store = useStore();
    const isAuthorized = computed(
      () => store.state.user.user && !store.state.user.user.isAnonymous
    );
    const route = useRoute();
    const change = ref({});

    watch(
      () => isAuthorized.value,
      async () => {
        if (isAuthorized.value) {
          // fetch change from firestore
          const docRef = doc(
            getFirestore(),
            "changes",
            route.params.id as string
          );
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            change.value = docSnap.data();
          }
        }
      },
      {
        immediate: true
      }
    );

    return {
      isAuthorized,
      route,
      change
    };
  }
};
</script>
