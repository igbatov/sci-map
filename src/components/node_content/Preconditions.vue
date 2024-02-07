<template>
  <div
    v-for="precondition of preconditions"
    class="p-grid"
    :key="precondition.id"
  >
    <div class="p-col-12">
      <div class="p-grid">
        <div :class="`p-col-10 ${$style.title}`">
          <a :href="precondition.id">{{ precondition.title }}</a>
        </div>
        <div class="p-col-2">
          <RemoveIcon @click="remove(precondition.id)" />
        </div>
      </div>
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
    watchEffect(() => {
      preconditions.value = [];
      if (
        props.nodeId &&
        store.state.precondition.preconditions[props.nodeId]
      ) {
        for (const id of store.state.precondition.preconditions[props.nodeId]) {
          preconditions.value.push(store.state.tree.nodeRecord[id].node);
        }
      }
    });

    return {
      preconditions,
      remove: async (id: string) => {
        if (!(store.state.user && store.state.user.user && !store.state.user.user.isAnonymous)) {
          await store.dispatch(`${actions.confirmSignInPopup}`, {confirm, message:"Please authorize to added node prerequisites"});
          return
        }

        const p = store.state.precondition.preconditions[props.nodeId];
        if (!p) {
          return;
        }
        if (p.indexOf(id) == -1) {
          return;
        }
        p.splice(p.indexOf(id), 1);
        api.savePreconditions(store.state.user.user, {
          nodeId: props.nodeId,
          preconditionIds: p
        });
      }
    };
  }
});
</script>

<style module>
.title {
  margin-top: 7px;
}
</style>
