<template>
  <h1 v-if="!isAuthorized">Only authorized users can view node profile</h1>
  <div v-else>
    <div><b>id:</b> {{ route.params.id }}</div>
    <div><b>is removed from map:</b> {{ node["is_in_trash"] }}</div>
    <div>
      <b>parent_id:</b>
      <a target="_blank" :href="node['map']['parentID']">{{
        node["map"]["parentID"]
      }}</a>
    </div>
    <div><b>name:</b> {{ node["map"]["name"] }}</div>
    <b>content:</b>
    <Markdown
      :content="node['node_content'] ? node['node_content']['content'] : ''"
      :rows="20"
      height="300px"
      :allowEdit="true"
    />
    <div>
      <b>precondition:</b>
      <div v-for="id of node['precondition']" :key="id">
        <a target="_blank" :href="id">{{ id }}</a>
      </div>
    </div>
    <div>
      <b>children:</b>
      <div v-for="id of node['map']['children']" :key="id">
        <a target="_blank" :href="id">{{ id }}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useRoute } from "vue-router";
import { useStore } from "@/store";
import { computed, watch, ref } from "vue";
import Markdown from "@/components/node_content/Markdown.vue";
import firebase from "firebase/compat";

export default {
  name: "NodeDescription",
  components: { Markdown },

  setup() {
    const store = useStore();
    const isAuthorized = computed(
      () => store.state.user.user && !store.state.user.user.isAnonymous
    );
    const route = useRoute();
    const node = ref({} as any);

    watch(
      () => isAuthorized.value,
      async () => {
        if (isAuthorized.value) {
          // fetch change from firestore
          const docRef = firebase
            .database()
            .ref(`/map/${route.params.id}`)
            .once("value", data => {
              if (data.exists()) {
                // not in /trash, try to get from /map, /node_content, /precondition
                node.value["is_in_trash"] = false;

                // map
                node.value["map"] = data.val();

                // node_content
                firebase
                  .database()
                  .ref(`/node_content/${route.params.id}`)
                  .once("value", data => {
                    if (data.exists()) {
                      node.value["node_content"] = data.val();
                    }
                  });

                // precondition
                firebase
                  .database()
                  .ref(`/precondition/${route.params.id}`)
                  .once("value", data => {
                    if (data.exists()) {
                      node.value["precondition"] = data.val();
                    }
                  });
              } else {
                firebase
                  .database()
                  .ref(`/trash/${route.params.id}`)
                  .once("value", data => {
                    if (data.exists()) {
                      node.value = data.val();
                      node.value["is_in_trash"] = true;
                    }
                  });
              }
            });
        }
      },
      {
        immediate: true
      }
    );

    return {
      isAuthorized: isAuthorized,
      route,
      node
    };
  }
};
</script>
