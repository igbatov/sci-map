<template>
  <div
    v-for="precondition of preconditions"
    :class="`p-grid ${$style.precondition} p-p-md-0`"
    :key="precondition.id"
  >
    <div class="p-col-10 p-pl-md-2">
        <p :class="`${$style.preconditionPath}`">
          {{preconditionPaths[precondition.id]}}
        </p>
        <p :class="`${$style.title}`">
          <a :href="precondition.id">{{ precondition.title }}</a>
        </p>
    </div>
    <div class="p-col-2 p-p-md-0">
      <RemoveIcon @click="remove(precondition.id)" />
    </div>
  </div>

</template>

<script lang="ts">
import { ref, watchEffect, defineComponent } from "vue";
import {actions, useStore} from "@/store";
import api from "@/api/api";
import { Tree } from "@/types/graphics";
import RemoveIcon from "@/components/node_content/RemoveIcon.vue";
import {useConfirm} from "primevue/useconfirm";
import {mutations as preconditionMutations} from "@/store/precondition";
import {getTreePathString} from "../helpers";

export default defineComponent({
  name: "Preconditions",
  props: {
    nodeId: {
      type: String,
      required: true
    }
  },
  components: {
    RemoveIcon
  },
  setup(props) {
    const store = useStore();
    const confirm = useConfirm();
    const preconditions = ref<Array<Tree>>([]);
    const preconditionPaths = ref<Record<string, string>>({});
    watchEffect(() => {
      preconditions.value = [];
      preconditionPaths.value = {};
      if (
        props.nodeId &&
        store.state.precondition.preconditions[props.nodeId]
      ) {
        for (const id of store.state.precondition.preconditions[props.nodeId]) {
          preconditions.value.push(store.state.tree.nodeRecord[id].node);
          preconditionPaths.value[id] = getTreePathString(id, store.state.tree.nodeRecord)
        }
      }
    });

    return {
      preconditions,
      preconditionPaths,
      remove: async (id: string) => {
        if (!(store.state.user && store.state.user.user && !store.state.user.user.isAnonymous)) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {confirm, message:"Please authorize to added node prerequisites"});
          return
        }

        store.commit(`precondition/${preconditionMutations.REMOVE_PRECONDITION}`, {
          nodeID: props.nodeId,
          preconditionID: id,
        });
        api.savePreconditions(store.state.user.user, {
          nodeId: props.nodeId,
          preconditionIds: store.state.precondition.preconditions[props.nodeId]
        });
      }
    };
  }
});
</script>

<style module>
.title {
  margin: 0;
  padding: 0;
}
.precondition {
  margin: 0;
}
.precondition:hover {
  background-color: rgb(3, 219, 252, 0.2);
}
.preconditionPath {
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
</style>
